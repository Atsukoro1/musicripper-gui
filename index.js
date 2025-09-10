const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const mm = require('music-metadata');
const NodeID3 = require('node-id3');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to search MusicBrainz for metadata
async function searchMusicBrainz(artist, title) {
  try {
    // Sanitize inputs for URL
    const sanitizedArtist = encodeURIComponent(artist);
    const sanitizedTitle = encodeURIComponent(title);
    
    // MusicBrainz API search
    const response = await axios.get(`http://musicbrainz.org/ws/2/recording`, {
      params: {
        query: `artist:"${sanitizedArtist}" AND recording:"${sanitizedTitle}"`,
        fmt: 'json'
      },
      headers: {
        'User-Agent': 'MusicRipper-GUI/1.0 ( https://github.com/your-username/musicripper-gui )'
      }
    });
    
    // Check if we have results
    if (response.data.recordings && response.data.recordings.length > 0) {
      const recording = response.data.recordings[0];
      
      // Get more detailed information
      const detailedResponse = await axios.get(`http://musicbrainz.org/ws/2/recording/${recording.id}`, {
        params: {
          fmt: 'json',
          inc: 'artists+releases+tags'
        },
        headers: {
          'User-Agent': 'MusicRipper-GUI/1.0 ( https://github.com/your-username/musicripper-gui )'
        }
      });
      
      const detailedRecording = detailedResponse.data;
      
      // Extract useful information
      const artistInfo = detailedRecording['artist-credit'] && detailedRecording['artist-credit'].length > 0 
        ? detailedRecording['artist-credit'][0].artist 
        : null;
      
      const releaseInfo = detailedRecording.releases && detailedRecording.releases.length > 0 
        ? detailedRecording.releases[0] 
        : null;
      
      return {
        artist: artistInfo ? artistInfo.name : artist,
        title: detailedRecording.title || title,
        album: releaseInfo ? releaseInfo.title : null,
        year: releaseInfo && releaseInfo.date ? new Date(releaseInfo.date).getFullYear() : null,
        trackNumber: null, // Not available in this API call
        genre: detailedRecording.tags && detailedRecording.tags.length > 0 
          ? detailedRecording.tags[0].name 
          : null,
        artistId: artistInfo ? artistInfo.id : null,
        trackId: detailedRecording.id,
        albumId: releaseInfo ? releaseInfo.id : null,
        albumArtistId: artistInfo ? artistInfo.id : null
      };
    }
    
    return null;
  } catch (error) {
    console.error('MusicBrainz search error:', error.message);
    return null;
  }
}

// Function to embed MusicBrainz metadata
async function embedMusicBrainzMetadata(filePath, musicBrainzData) {
  try {
    if (!musicBrainzData) return false;
    
    // Read existing metadata
    const existingTags = await NodeID3.Promise.read(filePath);
    
    // Merge with MusicBrainz data
    const tags = {
      ...existingTags,
      artist: musicBrainzData.artist || existingTags.artist,
      title: musicBrainzData.title || existingTags.title,
      album: musicBrainzData.album || existingTags.album,
      year: musicBrainzData.year || existingTags.year,
      trackNumber: musicBrainzData.trackNumber || existingTags.trackNumber,
      genre: musicBrainzData.genre || existingTags.genre,
      // Add MusicBrainz specific tags
      musicbrainz_artistid: musicBrainzData.artistId,
      musicbrainz_trackid: musicBrainzData.trackId,
      musicbrainz_albumid: musicBrainzData.albumId,
      musicbrainz_albumartistid: musicBrainzData.albumArtistId
    };
    
    // Write updated metadata
    await NodeID3.Promise.write(tags, filePath);
    return true;
  } catch (error) {
    console.error('Error embedding MusicBrainz metadata:', error.message);
    return false;
  }
}

// Function to search for lyrics using Lyrics.ovh API
async function searchLyrics(artist, title) {
  try {
    // Sanitize inputs for URL
    const sanitizedArtist = encodeURIComponent(artist);
    const sanitizedTitle = encodeURIComponent(title);
    
    // Try Lyrics.ovh API first
    try {
      const response = await axios.get(`https://api.lyrics.ovh/v1/${sanitizedArtist}/${sanitizedTitle}`);
      if (response.data && response.data.lyrics) {
        return response.data.lyrics;
      }
    } catch (error) {
      console.log('Lyrics.ovh API failed, trying alternative method');
    }
    
    return null;
  } catch (error) {
    console.error('Lyrics search error:', error.message);
    return null;
  }
}

// Function to embed lyrics in metadata
async function embedLyrics(filePath, lyrics) {
  try {
    if (!lyrics) return false;
    
    // Read existing metadata
    const existingTags = await NodeID3.Promise.read(filePath);
    
    // Add lyrics to tags
    const tags = {
      ...existingTags,
      unsynchronisedLyrics: {
        language: 'eng',
        text: lyrics
      }
    };
    
    // Write updated metadata
    await NodeID3.Promise.write(tags, filePath);
    return true;
  } catch (error) {
    console.error('Error embedding lyrics:', error.message);
    return false;
  }
}

// Download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { 
      url, 
      isPlaylist, 
      audioFormat, 
      audioQuality,
      embedThumbnail,
      embedMetadata,
      extractThumbnail,
      thumbnailFormat,
      downloadSubtitles,
      subtitleLangs,
      customArgs,
      embedMusicbrainz,
      downloadLyrics: downloadLyricsFlag
    } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Create temporary directory
    const tmpDir = await fs.mkdtemp('/tmp/musicripper-');
    
    // Build yt-dlp arguments
    const args = [
      '-x', // Extract audio
      '--audio-format', audioFormat || 'mp3',
      '--audio-quality', audioQuality || '0',
    ];
    
    // Add metadata embedding
    if (embedMetadata !== false) { // Default to true
      args.push('--add-metadata');
    }
    
    // Add thumbnail embedding
    if (embedThumbnail !== false) { // Default to true
      args.push('--embed-thumbnail');
    }
    
    // Add thumbnail extraction
    if (extractThumbnail) {
      args.push('--write-thumbnail');
      args.push('--convert-thumbnails');
      args.push(thumbnailFormat || 'jpg');
    }
    
    // Add subtitle downloading
    if (downloadSubtitles) {
      args.push('--write-sub');
      args.push('--sub-lang');
      args.push(subtitleLangs || 'en');
    }
    
    // Output template (properly escaped)
    args.push('-o');
    args.push(`${tmpDir}/%(artist)s - %(title)s.%(ext)s`);
    
    // Playlist options
    if (isPlaylist) {
      args.push('--yes-playlist');
    } else {
      args.push('--no-playlist');
    }
    
    // Add custom arguments if provided
    if (customArgs && customArgs.length > 0) {
      args.push(...customArgs.split(' '));
    }
    
    // Execute yt-dlp with proper escaping
    const command = `yt-dlp ${args.map(arg => `"${arg}"`).join(' ')} "${url}"`;
    console.log('Executing:', command);
    
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Download error:', error);
        // Clean up temp directory even on error
        try {
          await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        return res.status(500).json({ 
          error: 'Download failed', 
          details: stderr || error.message 
        });
      }
      
      // List downloaded files
      try {
        const files = await fs.readdir(tmpDir);
        const audioFiles = files.filter(file => 
          file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.m4a') || file.endsWith('.wav') ||
          file.endsWith('.aac') || file.endsWith('.ogg') || file.endsWith('.wma')
        );
        
        // Process each audio file
        for (const file of audioFiles) {
          const filePath = path.join(tmpDir, file);
          
          // Read metadata to get artist and title
          const metadata = await mm.parseFile(filePath);
          const artist = metadata.common.artist || 'Unknown Artist';
          const title = metadata.common.title || file.replace(/\.[^/.]+$/, "");
          
          // Embed MusicBrainz metadata if requested
          if (embedMusicbrainz) {
            const musicBrainzData = await searchMusicBrainz(artist, title);
            if (musicBrainzData) {
              await embedMusicBrainzMetadata(filePath, musicBrainzData);
            }
          }
          
          // Download and embed lyrics if requested
          if (downloadLyricsFlag) {
            const lyrics = await searchLyrics(artist, title);
            if (lyrics) {
              await embedLyrics(filePath, lyrics);
            }
          }
        }
        
        // Move files to downloads directory
        const downloadDir = path.join(__dirname, 'downloads');
        await fs.mkdir(downloadDir, { recursive: true });
        
        for (const file of audioFiles) {
          await fs.rename(
            path.join(tmpDir, file),
            path.join(downloadDir, file)
          );
        }
        
        // Clean up temp directory
        await fs.rm(tmpDir, { recursive: true, force: true });
        
        res.json({
          success: true,
          files: audioFiles,
          message: `Downloaded ${audioFiles.length} files`,
          downloadDir: downloadDir
        });
      } catch (moveError) {
        console.error('File move error:', moveError);
        // Clean up temp directory even on error
        try {
          await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        res.status(500).json({ error: 'Failed to move files', details: moveError.message });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Transfer files to remote server
app.post('/api/transfer', async (req, res) => {
  try {
    const { serverUser, serverHost, serverDir, serverPass } = req.body;
    
    // Validate required fields
    if (!serverUser || !serverHost || !serverDir) {
      return res.status(400).json({ error: 'Server user, host, and directory are required' });
    }
    
    // Get downloaded files
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.mkdir(downloadDir, { recursive: true });
    const files = await fs.readdir(downloadDir);
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.m4a') || file.endsWith('.wav') ||
      file.endsWith('.aac') || file.endsWith('.ogg') || file.endsWith('.wma')
    );
    
    if (audioFiles.length === 0) {
      return res.status(400).json({ error: 'No audio files found to transfer' });
    }
    
    // Build SCP command
    let command;
    if (serverPass) {
      // Use sshpass if password is provided
      command = `sshpass -p "${serverPass}" scp "${downloadDir}"/*.{mp3,flac,m4a,wav,aac,ogg,wma} "${serverUser}@${serverHost}:${serverDir}/"`;
    } else {
      // Use scp without password (assumes SSH keys are set up)
      command = `scp "${downloadDir}"/*.{mp3,flac,m4a,wav,aac,ogg,wma} "${serverUser}@${serverHost}:${serverDir}/"`;
    }
    
    console.log('Executing transfer command:', command);
    
    // Execute transfer command
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Transfer error:', error);
        return res.status(500).json({ 
          error: 'Transfer failed', 
          details: stderr || error.message 
        });
      }
      
      res.json({
        success: true,
        message: `Transferred ${audioFiles.length} files to ${serverUser}@${serverHost}:${serverDir}`,
        files: audioFiles
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get downloaded files
app.get('/api/files', async (req, res) => {
  try {
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.mkdir(downloadDir, { recursive: true });
    const files = await fs.readdir(downloadDir);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// Serve downloaded files
app.get('/downloads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'downloads', filename);
  
  // Security check to prevent directory traversal
  if (path.resolve(filePath).startsWith(path.resolve(path.join(__dirname, 'downloads')))) {
    res.sendFile(filePath);
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MusicRipper GUI listening at http://0.0.0.0:${PORT}`);
});