import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadForm from './DownloadForm';

// Mock the shadcn/ui components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props) => <input type="checkbox" {...props} />
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children }) => <div>{children}</div>,
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: ({ children }) => <div>{children}</div>
}));

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => <div>Download Icon</div>,
  Server: () => <div>Server Icon</div>,
  FileAudio: () => <div>File Audio Icon</div>,
  Music: () => <div>Music Icon</div>
}));

describe('DownloadForm', () => {
  const mockProps = {
    url: '',
    setUrl: jest.fn(),
    isPlaylist: false,
    setIsPlaylist: jest.fn(),
    audioFormat: 'mp3',
    setAudioFormat: jest.fn(),
    audioQuality: '0',
    setAudioQuality: jest.fn(),
    embedThumbnail: true,
    setEmbedThumbnail: jest.fn(),
    embedMetadata: true,
    setEmbedMetadata: jest.fn(),
    extractThumbnail: false,
    setExtractThumbnail: jest.fn(),
    thumbnailFormat: 'jpg',
    setThumbnailFormat: jest.fn(),
    downloadSubtitles: false,
    setDownloadSubtitles: jest.fn(),
    subtitleLangs: 'en',
    setSubtitleLangs: jest.fn(),
    customArgs: '',
    setCustomArgs: jest.fn(),
    embedMusicbrainz: false,
    setEmbedMusicbrainz: jest.fn(),
    downloadLyrics: false,
    setDownloadLyrics: jest.fn(),
    isDownloading: false,
    handleSubmit: jest.fn()
  };

  it('renders without crashing', () => {
    render(<DownloadForm {...mockProps} />);
    expect(screen.getByText('Download Music')).toBeInTheDocument();
  });

  it('renders URL input field', () => {
    render(<DownloadForm {...mockProps} />);
    expect(screen.getByPlaceholderText('Enter URL (YouTube, SoundCloud, etc.)')).toBeInTheDocument();
  });

  it('renders download button', () => {
    render(<DownloadForm {...mockProps} />);
    expect(screen.getByText('Download')).toBeInTheDocument();
  });
});