import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileAudio, Music, Edit, CloudDownload, Download, X } from 'lucide-react';

const FileList = ({ 
  downloadedFiles, 
  searchQuery, 
  setSearchQuery, 
  pagination, 
  goToPage, 
  editingFile, 
  editMetadata, 
  setEditMetadata, 
  startEditing, 
  cancelEditing, 
  saveMetadata, 
  importFromLastFm 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Downloaded Files
        </CardTitle>
        <CardDescription>Manage your downloaded music files</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              className="pl-10"
              placeholder="Search music files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  goToPage(1);
                }
              }}
            />
          </div>
          <Button onClick={() => goToPage(1)}>
            <Search className="h-4 w-4" />
          </Button>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                goToPage(1);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {downloadedFiles.length > 0 ? (
          <>
            <div className="space-y-4">
              {downloadedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-4">
                  {editingFile === file.name ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Edit Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={editMetadata.title}
                            onChange={(e) => setEditMetadata({...editMetadata, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Artist</Label>
                          <Input
                            value={editMetadata.artist}
                            onChange={(e) => setEditMetadata({...editMetadata, artist: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Album</Label>
                          <Input
                            value={editMetadata.album}
                            onChange={(e) => setEditMetadata({...editMetadata, album: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input
                            value={editMetadata.year}
                            onChange={(e) => setEditMetadata({...editMetadata, year: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Genre</Label>
                          <Input
                            value={editMetadata.genre}
                            onChange={(e) => setEditMetadata({...editMetadata, genre: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveMetadata}>Save</Button>
                        <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center justify-center bg-gray-100 rounded-lg w-16 h-16 flex-shrink-0">
                        <Music className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{file.metadata.title || 'Unknown Title'}</div>
                        <div className="text-sm text-gray-500">{file.metadata.artist || 'Unknown Artist'}</div>
                        <div className="text-sm text-gray-500">{file.metadata.album || 'Unknown Album'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {file.metadata.year || 'Unknown Year'} • {file.metadata.genre || 'Unknown Genre'} • {file.metadata.duration || 'Unknown'} seconds
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditing(file)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => importFromLastFm(file.name)}
                        >
                          <CloudDownload className="h-4 w-4" />
                        </Button>
                        <a 
                          href={`/downloads/${file.name}`} 
                          download={file.name}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-6">
              <Button 
                onClick={() => goToPage(pagination.currentPage - 1)} 
                disabled={!pagination.hasPrev}
                variant="outline"
              >
                Previous
              </Button>
              
              <div className="text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
                {' '}({pagination.totalFiles} total files)
              </div>
              
              <Button 
                onClick={() => goToPage(pagination.currentPage + 1)} 
                disabled={!pagination.hasNext}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No downloaded files yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileList;