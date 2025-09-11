import React, { useState, useEffect } from 'react';

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
  
  // Transfer state
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [serverUser, setServerUser] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverDir, setServerDir] = useState('');
  const [serverPass, setServerPass] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');

  // Fetch downloaded files on component mount and when page changes
  useEffect(() => {
    fetchDownloadedFiles();
  }, [pagination.currentPage]);

  const fetchDownloadedFiles = async () => {
    try {
      const response = await fetch(`/api/files?page=${pagination.currentPage}&limit=10`);
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

  const nextPage = () => {
    if (pagination.hasNext) {
      goToPage(pagination.currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      goToPage(pagination.currentPage - 1);
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
    <div className="app">
      <header className="app-header">
        <h1><i className="fas fa-music"></i> MusicRipper GUI</h1>
        <p>Download music from YouTube, SoundCloud, and other platforms</p>
      </header>

      <main className="app-main">
        <section className="download-section">
          <h2><i className="fas fa-download"></i> Download Music</h2>
          <form onSubmit={handleSubmit} className="download-form">
            <div className="form-group">
              <label htmlFor="url">URL:</label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (YouTube, SoundCloud, etc.)"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isPlaylist"
                checked={isPlaylist}
                onChange={(e) => setIsPlaylist(e.target.checked)}
              />
              <label htmlFor="isPlaylist">Download as Playlist</label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="audioFormat">Audio Format:</label>
                <select
                  id="audioFormat"
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                >
                  <option value="mp3">MP3</option>
                  <option value="flac">FLAC</option>
                  <option value="m4a">M4A</option>
                  <option value="wav">WAV</option>
                  <option value="aac">AAC</option>
                  <option value="ogg">OGG</option>
                  <option value="wma">WMA</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="audioQuality">Audio Quality:</label>
                <select
                  id="audioQuality"
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                >
                  <option value="0">Best</option>
                  <option value="1">High</option>
                  <option value="2">Medium</option>
                  <option value="3">Low</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="embedThumbnail"
                  checked={embedThumbnail}
                  onChange={(e) => setEmbedThumbnail(e.target.checked)}
                />
                <label htmlFor="embedThumbnail">Embed Thumbnail</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="embedMetadata"
                  checked={embedMetadata}
                  onChange={(e) => setEmbedMetadata(e.target.checked)}
                />
                <label htmlFor="embedMetadata">Embed Metadata</label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="extractThumbnail"
                  checked={extractThumbnail}
                  onChange={(e) => setExtractThumbnail(e.target.checked)}
                />
                <label htmlFor="extractThumbnail">Extract Thumbnail</label>
              </div>

              <div className="form-group">
                <label htmlFor="thumbnailFormat">Thumbnail Format:</label>
                <select
                  id="thumbnailFormat"
                  value={thumbnailFormat}
                  onChange={(e) => setThumbnailFormat(e.target.value)}
                  disabled={!extractThumbnail}
                >
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="downloadSubtitles"
                  checked={downloadSubtitles}
                  onChange={(e) => setDownloadSubtitles(e.target.checked)}
                />
                <label htmlFor="downloadSubtitles">Download Subtitles</label>
              </div>

              <div className="form-group">
                <label htmlFor="subtitleLangs">Subtitle Languages:</label>
                <input
                  type="text"
                  id="subtitleLangs"
                  value={subtitleLangs}
                  onChange={(e) => setSubtitleLangs(e.target.value)}
                  placeholder="en,es,fr"
                  disabled={!downloadSubtitles}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="embedMusicbrainz"
                  checked={embedMusicbrainz}
                  onChange={(e) => setEmbedMusicbrainz(e.target.checked)}
                />
                <label htmlFor="embedMusicbrainz">Embed MusicBrainz Metadata</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="downloadLyrics"
                  checked={downloadLyrics}
                  onChange={(e) => setDownloadLyrics(e.target.checked)}
                />
                <label htmlFor="downloadLyrics">Download Lyrics</label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="customArgs">Custom Arguments:</label>
              <input
                type="text"
                id="customArgs"
                value={customArgs}
                onChange={(e) => setCustomArgs(e.target.value)}
                placeholder="--proxy http://myproxy:8080 --retries 3"
              />
            </div>

            <button 
              type="submit" 
              disabled={isDownloading || !url}
              className="download-button"
            >
              {isDownloading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Downloading...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> Download
                </>
              )}
            </button>
          </form>

          {downloadStatus && (
            <div className={`status-message ${downloadStatus.includes('failed') ? 'error' : 'success'}`}>
              {downloadStatus}
            </div>
          )}
        </section>

        <section className="transfer-section">
          <h2><i className="fas fa-server"></i> Transfer Files</h2>
          <button 
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="toggle-transfer-button"
          >
            {showTransferForm ? 'Hide Transfer Form' : 'Show Transfer Form'}
          </button>
          
          {showTransferForm && (
            <form onSubmit={handleTransfer} className="transfer-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="serverUser">Server User:</label>
                  <input
                    type="text"
                    id="serverUser"
                    value={serverUser}
                    onChange={(e) => setServerUser(e.target.value)}
                    placeholder="username"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="serverHost">Server Host:</label>
                  <input
                    type="text"
                    id="serverHost"
                    value={serverHost}
                    onChange={(e) => setServerHost(e.target.value)}
                    placeholder="hostname or IP"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="serverDir">Server Directory:</label>
                <input
                  type="text"
                  id="serverDir"
                  value={serverDir}
                  onChange={(e) => setServerDir(e.target.value)}
                  placeholder="/path/to/directory"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="serverPass">Password (optional):</label>
                <input
                  type="password"
                  id="serverPass"
                  value={serverPass}
                  onChange={(e) => setServerPass(e.target.value)}
                  placeholder="Password (if required)"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isTransferring}
                className="transfer-button"
              >
                {isTransferring ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Transferring...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i> Transfer Files
                  </>
                )}
              </button>
              
              {transferStatus && (
                <div className={`status-message ${transferStatus.includes('failed') ? 'error' : 'success'}`}>
                  {transferStatus}
                </div>
              )}
            </form>
          )}
        </section>

        <section className="files-section">
          <h2><i className="fas fa-file-audio"></i> Downloaded Files</h2>
          {downloadedFiles.length > 0 ? (
            <>
              <div className="files-list">
                {downloadedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    {editingFile === file.name ? (
                      <div className="edit-form">
                        <h3>Edit Metadata</h3>
                        <div className="form-group">
                          <label>Title:</label>
                          <input
                            type="text"
                            value={editMetadata.title}
                            onChange={(e) => setEditMetadata({...editMetadata, title: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Artist:</label>
                          <input
                            type="text"
                            value={editMetadata.artist}
                            onChange={(e) => setEditMetadata({...editMetadata, artist: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Album:</label>
                          <input
                            type="text"
                            value={editMetadata.album}
                            onChange={(e) => setEditMetadata({...editMetadata, album: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Year:</label>
                          <input
                            type="text"
                            value={editMetadata.year}
                            onChange={(e) => setEditMetadata({...editMetadata, year: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Genre:</label>
                          <input
                            type="text"
                            value={editMetadata.genre}
                            onChange={(e) => setEditMetadata({...editMetadata, genre: e.target.value})}
                          />
                        </div>
                        <div className="edit-actions">
                          <button onClick={saveMetadata} className="save-button">Save</button>
                          <button onClick={cancelEditing} className="cancel-button">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="file-info">
                          <i className="fas fa-music"></i>
                          <div className="file-details">
                            <span className="file-name">{file.metadata.title}</span>
                            <span className="file-artist">{file.metadata.artist}</span>
                            <span className="file-album">{file.metadata.album}</span>
                            <span className="file-meta">
                              {file.metadata.year} • {file.metadata.genre} • {file.metadata.duration} seconds
                            </span>
                          </div>
                        </div>
                        <div className="file-actions">
                          <button 
                            onClick={() => startEditing(file)} 
                            className="edit-button"
                            title="Edit Metadata"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => importFromLastFm(file.name)} 
                            className="import-button"
                            title="Import from Last.fm"
                          >
                            <i className="fas fa-cloud-download-alt"></i>
                          </button>
                          <a 
                            href={`/downloads/${file.name}`} 
                            download={file.name}
                            className="download-link"
                            title="Download"
                          >
                            <i className="fas fa-download"></i>
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Pagination controls */}
              <div className="pagination">
                <button 
                  onClick={prevPage} 
                  disabled={!pagination.hasPrev}
                  className="pagination-button"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  {' '}({pagination.totalFiles} total files)
                </span>
                
                <button 
                  onClick={nextPage} 
                  disabled={!pagination.hasNext}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="no-files">No downloaded files yet.</p>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>MusicRipper GUI &copy; 2023 - Self-hostable music downloader</p>
      </footer>
    </div>
  );
};

export default App;