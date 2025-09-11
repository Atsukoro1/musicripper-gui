import { useState, useEffect } from 'react';
import DownloadForm from '@/components/musicripper/DownloadForm';
import TransferForm from '@/components/musicripper/TransferForm';
import FileList from '@/components/musicripper/FileList';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Server } from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [audioQuality, setAudioQuality] = useState('0');
  const [embedThumbnail, setEmbedThumbnail] = useState(true);
  const [embedMetadata, setEmbedMetadata] = useState(true);
  const [extractThumbnail, setExtractThumbnail] = useState(false);
  const [thumbnailFormat, setThumbnailFormat] = useState('jpg');
  const [downloadSubtitles, setDownloadSubtitles] = useState(false);
  const [subtitleLangs, setSubtitleLangs] = useState('en');
  const [customArgs, setCustomArgs] = useState('');
  const [embedMusicbrainz, setEmbedMusicbrainz] = useState(false);
  const [downloadLyrics, setDownloadLyrics] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transfer state
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [serverUser, setServerUser] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverDir, setServerDir] = useState('');
  const [serverPass, setServerPass] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');

  // Fetch downloaded files on component mount and when page/search changes
  useEffect(() => {
    fetchDownloadedFiles();
  }, [pagination.currentPage, searchQuery]);

  const fetchDownloadedFiles = async () => {
    try {
      const baseUrl = searchQuery 
        ? `/api/search?q=${encodeURIComponent(searchQuery)}`
        : `/api/files`;
        
      const response = await fetch(`${baseUrl}&page=${pagination.currentPage}&limit=10`);
      const data = await response.json();
      setDownloadedFiles(data.files || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalFiles: 0,
        hasNext: false,
        hasPrev: false
      });
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setDownloadStatus('Starting download...');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          downloadLyrics
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setDownloadStatus(`Download complete! ${data.files?.length || 0} files downloaded.`);
        // Refresh the file list
        fetchDownloadedFiles();
      } else {
        setDownloadStatus(`Download failed: ${data.error}`);
      }
    } catch (error) {
      setDownloadStatus(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    setIsTransferring(true);
    setTransferStatus('Starting transfer...');

    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUser,
          serverHost,
          serverDir,
          serverPass
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTransferStatus(`Transfer complete! ${data.files?.length || 0} files transferred.`);
      } else {
        setTransferStatus(`Transfer failed: ${data.error}`);
      }
    } catch (error) {
      setTransferStatus(`Transfer failed: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  // Metadata editing
  const [editingFile, setEditingFile] = useState(null);
  const [editMetadata, setEditMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    year: '',
    genre: ''
  });

  const startEditing = (file) => {
    setEditingFile(file.name);
    setEditMetadata({
      title: file.metadata.title || '',
      artist: file.metadata.artist || '',
      album: file.metadata.album || '',
      year: file.metadata.year || '',
      genre: file.metadata.genre || ''
    });
  };

  const cancelEditing = () => {
    setEditingFile(null);
    setEditMetadata({
      title: '',
      artist: '',
      album: '',
      year: '',
      genre: ''
    });
  };

  const saveMetadata = async () => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(editingFile)}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editMetadata),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the file list
        fetchDownloadedFiles();
        cancelEditing();
        alert('Metadata updated successfully!');
      } else {
        alert(`Failed to update metadata: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to update metadata: ${error.message}`);
    }
  };

  // Import from Last.fm
  const importFromLastFm = async (filename) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}/import-lastfm`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the file list
        fetchDownloadedFiles();
        alert('Metadata imported from Last.fm successfully!');
      } else {
        alert(`Failed to import metadata: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to import metadata: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3 text-3xl md:text-4xl">
                <Music className="h-8 w-8" />
                MusicRipper GUI
              </CardTitle>
              <p className="text-white/90 text-lg">Download music from YouTube, SoundCloud, and other platforms</p>
            </CardHeader>
          </Card>
        </header>

        <main className="space-y-8">
          <DownloadForm 
            url={url}
            setUrl={setUrl}
            isPlaylist={isPlaylist}
            setIsPlaylist={setIsPlaylist}
            audioFormat={audioFormat}
            setAudioFormat={setAudioFormat}
            audioQuality={audioQuality}
            setAudioQuality={setAudioQuality}
            embedThumbnail={embedThumbnail}
            setEmbedThumbnail={setEmbedThumbnail}
            embedMetadata={embedMetadata}
            setEmbedMetadata={setEmbedMetadata}
            extractThumbnail={extractThumbnail}
            setExtractThumbnail={setExtractThumbnail}
            thumbnailFormat={thumbnailFormat}
            setThumbnailFormat={setThumbnailFormat}
            downloadSubtitles={downloadSubtitles}
            setDownloadSubtitles={setDownloadSubtitles}
            subtitleLangs={subtitleLangs}
            setSubtitleLangs={setSubtitleLangs}
            customArgs={customArgs}
            setCustomArgs={setCustomArgs}
            embedMusicbrainz={embedMusicbrainz}
            setEmbedMusicbrainz={setEmbedMusicbrainz}
            downloadLyrics={downloadLyrics}
            setDownloadLyrics={setDownloadLyrics}
            isDownloading={isDownloading}
            handleSubmit={handleSubmit}
          />

          {downloadStatus && (
            <div className={`p-4 rounded-lg ${downloadStatus.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {downloadStatus}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Transfer Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowTransferForm(!showTransferForm)}
                variant="outline"
                className="mb-4"
              >
                {showTransferForm ? 'Hide Transfer Form' : 'Show Transfer Form'}
              </Button>
              
              {showTransferForm && (
                <TransferForm 
                  serverUser={serverUser}
                  setServerUser={setServerUser}
                  serverHost={serverHost}
                  setServerHost={setServerHost}
                  serverDir={serverDir}
                  setServerDir={setServerDir}
                  serverPass={serverPass}
                  setServerPass={setServerPass}
                  isTransferring={isTransferring}
                  handleTransfer={handleTransfer}
                />
              )}
              
              {transferStatus && (
                <div className={`mt-4 p-4 rounded-lg ${transferStatus.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {transferStatus}
                </div>
              )}
            </CardContent>
          </Card>

          <FileList 
            downloadedFiles={downloadedFiles}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            pagination={pagination}
            goToPage={goToPage}
            editingFile={editingFile}
            editMetadata={editMetadata}
            setEditMetadata={setEditMetadata}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            saveMetadata={saveMetadata}
            importFromLastFm={importFromLastFm}
          />
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>MusicRipper GUI &copy; 2023 - Self-hostable music downloader</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
