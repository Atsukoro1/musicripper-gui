import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Download, Server, FileAudio, Music } from 'lucide-react';

const DownloadForm = ({ 
  url, 
  setUrl, 
  isPlaylist, 
  setIsPlaylist, 
  audioFormat, 
  setAudioFormat, 
  audioQuality, 
  setAudioQuality, 
  embedThumbnail, 
  setEmbedThumbnail, 
  embedMetadata, 
  setEmbedMetadata, 
  extractThumbnail, 
  setExtractThumbnail, 
  thumbnailFormat, 
  setThumbnailFormat, 
  downloadSubtitles, 
  setDownloadSubtitles, 
  subtitleLangs, 
  setSubtitleLangs, 
  customArgs, 
  setCustomArgs, 
  embedMusicbrainz, 
  setEmbedMusicbrainz, 
  downloadLyrics, 
  setDownloadLyrics, 
  isDownloading, 
  handleSubmit 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Music
        </CardTitle>
        <CardDescription>Download music from YouTube, SoundCloud, and other platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL (YouTube, SoundCloud, etc.)"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPlaylist"
              checked={isPlaylist}
              onCheckedChange={setIsPlaylist}
            />
            <Label htmlFor="isPlaylist">Download as Playlist</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audioFormat">Audio Format</Label>
              <Select value={audioFormat} onValueChange={setAudioFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="m4a">M4A</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="aac">AAC</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                  <SelectItem value="wma">WMA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audioQuality">Audio Quality</Label>
              <Select value={audioQuality} onValueChange={setAudioQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Best</SelectItem>
                  <SelectItem value="1">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="embedThumbnail"
                checked={embedThumbnail}
                onCheckedChange={setEmbedThumbnail}
              />
              <Label htmlFor="embedThumbnail">Embed Thumbnail</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="embedMetadata"
                checked={embedMetadata}
                onCheckedChange={setEmbedMetadata}
              />
              <Label htmlFor="embedMetadata">Embed Metadata</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="extractThumbnail"
                checked={extractThumbnail}
                onCheckedChange={setExtractThumbnail}
              />
              <Label htmlFor="extractThumbnail">Extract Thumbnail</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailFormat">Thumbnail Format</Label>
              <Select value={thumbnailFormat} onValueChange={setThumbnailFormat} disabled={!extractThumbnail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="downloadSubtitles"
                checked={downloadSubtitles}
                onCheckedChange={setDownloadSubtitles}
              />
              <Label htmlFor="downloadSubtitles">Download Subtitles</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitleLangs">Subtitle Languages</Label>
              <Input
                id="subtitleLangs"
                value={subtitleLangs}
                onChange={(e) => setSubtitleLangs(e.target.value)}
                placeholder="en,es,fr"
                disabled={!downloadSubtitles}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="embedMusicbrainz"
                checked={embedMusicbrainz}
                onCheckedChange={setEmbedMusicbrainz}
              />
              <Label htmlFor="embedMusicbrainz">Embed MusicBrainz Metadata</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="downloadLyrics"
                checked={downloadLyrics}
                onCheckedChange={setDownloadLyrics}
              />
              <Label htmlFor="downloadLyrics">Download Lyrics</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customArgs">Custom Arguments</Label>
            <Input
              id="customArgs"
              value={customArgs}
              onChange={(e) => setCustomArgs(e.target.value)}
              placeholder="--proxy http://myproxy:8080 --retries 3"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isDownloading || !url}
            className="w-full"
          >
            {isDownloading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DownloadForm;