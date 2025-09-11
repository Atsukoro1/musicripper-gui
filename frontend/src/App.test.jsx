import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the child components
jest.mock('@/components/musicripper/DownloadForm', () => {
  return function DownloadForm() {
    return <div data-testid="download-form">Download Form</div>;
  };
});

jest.mock('@/components/musicripper/TransferForm', () => {
  return function TransferForm() {
    return <div data-testid="transfer-form">Transfer Form</div>;
  };
});

jest.mock('@/components/musicripper/FileList', () => {
  return function FileList() {
    return <div data-testid="file-list">File List</div>;
  };
});

// Mock the shadcn/ui components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardDescription: ({ children }) => <div>{children}</div>
}));

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Music: () => <div>Music Icon</div>,
  Server: () => <div>Server Icon</div>,
  Download: () => <div>Download Icon</div>
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('MusicRipper GUI')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    render(<App />);
    expect(screen.getByTestId('download-form')).toBeInTheDocument();
    // TransferForm is only rendered when the button is clicked, so we check for the button instead
    expect(screen.getByText('Show Transfer Form')).toBeInTheDocument();
    expect(screen.getByTestId('file-list')).toBeInTheDocument();
  });

  it('renders header with correct text', () => {
    render(<App />);
    expect(screen.getByText('Download music from YouTube, SoundCloud, and other platforms')).toBeInTheDocument();
  });
});