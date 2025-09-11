const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const mm = require('music-metadata');
const NodeID3 = require('node-id3');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration from environment variables
const config = {
  port: PORT,
  musicbrainz: {
    userAgent: process.env.MUSICBRAINZ_USER_AGENT || 'MusicRipper-GUI/1.0 ( https://github.com/your-username/musicripper-gui )'
  },
  lastfm: {
    apiKey: process.env.LASTFM_API_KEY || null
  },
  downloadDir: process.env.DOWNLOAD_DIR || './downloads',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
};

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

// Function to search Last.fm for metadata
async function searchLastFm(artist, title) {
  try {
    // Check if Last.fm API key is configured
    if (!config.lastfm.apiKey) {
      console.log('Last.fm API key not configured');
      return null;
    }
    
    // Sanitize inputs for URL
    const sanitizedArtist = encodeURIComponent(artist);
    const sanitizedTitle = encodeURIComponent(title);
    
    // Last.fm API search
    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
      params: {
        method: 'track.getInfo',
        api_key: config.lastfm.apiKey,
        artist: sanitizedArtist,
        track: sanitizedTitle,
        format: 'json'
      }
    });
    
    // Check if we have results
    if (response.data && response.data.track) {
      const track = response.data.track;
      
      return {
        artist: track.artist ? track.artist.name : artist,
        title: track.name || title,
        album: track.album ? track.album.title : null,
        year: track.album && track.album.wiki ? new Date(track.album.wiki.published).getFullYear() : null,
        genre: track.toptags && track.toptags.tag && track.toptags.tag.length > 0 
          ? track.toptags.tag[0].name 
          : null,
        duration: track.duration ? Math.round(track.duration / 1000) : null // Convert from ms to seconds
      };
    }
    
    return null;
  } catch (error) {
    console.error('Last.fm search error:', error.message);
    return null;
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
    
    // Create temporary directory within downloads folder to avoid cross-device link errors
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.mkdir(downloadDir, { recursive: true });
    const tmpDir = await fs.mkdtemp(path.join(downloadDir, 'tmp-'));
    
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
          const files = await fs.readdir(tmpDir);
          for (const file of files) {
            await fs.unlink(path.join(tmpDir, file));
          }
          await fs.rmdir(tmpDir);
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
        
        // Copy files to downloads directory (using copy + unlink to avoid cross-device link errors)
        const downloadDir = path.join(__dirname, 'downloads');
        await fs.mkdir(downloadDir, { recursive: true });
        
        for (const file of audioFiles) {
          const srcPath = path.join(tmpDir, file);
          const destPath = path.join(downloadDir, file);
          // Copy file instead of rename to handle cross-device scenarios
          await fs.copyFile(srcPath, destPath);
        }
        
        // Clean up temp directory and files
        for (const file of audioFiles) {
          // Remove temporary file
          await fs.unlink(path.join(tmpDir, file));
        }
        // Remove temporary directory
        await fs.rmdir(tmpDir);
        
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
          const files = await fs.readdir(tmpDir);
          for (const file of files) {
            await fs.unlink(path.join(tmpDir, file));
          }
          await fs.rmdir(tmpDir);
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

// Get downloaded files with pagination and metadata
app.get('/api/files', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.mkdir(downloadDir, { recursive: true });
    const files = await fs.readdir(downloadDir);
    
    // Filter for audio files only
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.m4a') || file.endsWith('.wav') ||
      file.endsWith('.aac') || file.endsWith('.ogg') || file.endsWith('.wma')
    );
    
    // Paginate results
    const paginatedFiles = audioFiles.slice(offset, offset + limit);
    
    // Get metadata for each file
    const filesWithMetadata = [];
    for (const file of paginatedFiles) {
      try {
        const filePath = path.join(downloadDir, file);
        const metadata = await mm.parseFile(filePath);
        filesWithMetadata.push({
          name: file,
          metadata: {
            title: metadata.common.title || file.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            year: metadata.common.year || 'Unknown Year',
            genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown Genre',
            duration: metadata.format.duration ? Math.round(metadata.format.duration) : 0
          }
        });
      } catch (metadataError) {
        // If metadata parsing fails, return basic file info
        filesWithMetadata.push({
          name: file,
          metadata: {
            title: file.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            year: 'Unknown Year',
            genre: 'Unknown Genre',
            duration: 0
          }
        });
      }
    }
    
    res.json({
      files: filesWithMetadata,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(audioFiles.length / limit),
        totalFiles: audioFiles.length,
        hasNext: page < Math.ceil(audioFiles.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// Update metadata for a file
app.put('/api/files/:filename/metadata', async (req, res) => {
  try {
    const filename = req.params.filename;
    const { title, artist, album, year, genre } = req.body;
    
    // Security check to prevent directory traversal
    if (filename.includes('../') || filename.includes('..\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, 'downloads', filename);
    
    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Read existing metadata
    const existingTags = await NodeID3.Promise.read(filePath);
    
    // Update tags with new values
    const tags = {
      ...existingTags,
      title: title || existingTags.title,
      artist: artist || existingTags.artist,
      album: album || existingTags.album,
      year: year || existingTags.year,
      genre: genre || existingTags.genre
    };
    
    // Write updated metadata
    await NodeID3.Promise.write(tags, filePath);
    
    res.json({ success: true, message: 'Metadata updated successfully' });
  } catch (error) {
    console.error('Metadata update error:', error);
    res.status(500).json({ error: 'Failed to update metadata', details: error.message });
  }
});

// Import metadata from Last.fm for a file
app.post('/api/files/:filename/import-lastfm', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security check to prevent directory traversal
    if (filename.includes('../') || filename.includes('..\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, 'downloads', filename);
    
    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if Last.fm API key is configured
    if (!config.lastfm.apiKey) {
      return res.status(400).json({ error: 'Last.fm API key not configured' });
    }
    
    // Read existing metadata
    const metadata = await mm.parseFile(filePath);
    const artist = metadata.common.artist || 'Unknown Artist';
    const title = metadata.common.title || filename.replace(/\.[^/.]+$/, "");
    
    // Search Last.fm for metadata
    const lastFmData = await searchLastFm(artist, title);
    
    if (!lastFmData) {
      return res.status(404).json({ error: 'No metadata found on Last.fm' });
    }
    
    // Read existing ID3 tags
    const existingTags = await NodeID3.Promise.read(filePath);
    
    // Merge with Last.fm data
    const tags = {
      ...existingTags,
      title: lastFmData.title || existingTags.title,
      artist: lastFmData.artist || existingTags.artist,
      album: lastFmData.album || existingTags.album,
      year: lastFmData.year || existingTags.year,
      genre: lastFmData.genre || existingTags.genre
    };
    
    // Write updated metadata
    await NodeID3.Promise.write(tags, filePath);
    
    res.json({ 
      success: true, 
      message: 'Metadata imported from Last.fm successfully',
      metadata: lastFmData
    });
  } catch (error) {
    console.error('Last.fm import error:', error);
    res.status(500).json({ error: 'Failed to import metadata from Last.fm', details: error.message });
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