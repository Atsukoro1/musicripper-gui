# MusicRipper GUI

A self-hostable GUI for downloading music using yt-dlp, deployable with Docker. Supports downloading from YouTube, SoundCloud, and other services supported by yt-dlp.

## Features

- Beautiful web-based GUI
- Download music from YouTube, SoundCloud, and other platforms
- Playlist support
- Multiple audio formats (MP3, FLAC, M4A, WAV, AAC, OGG, WMA)
- Metadata extraction and thumbnail embedding
- Thumbnail extraction in various formats (JPG, PNG, WebP)
- Subtitle downloading
- MusicBrainz metadata embedding
- Lyrics downloading and embedding
- Custom yt-dlp arguments
- Docker deployment with GitHub Actions pipeline
- Responsive design
- File transfer to remote servers

## Prerequisites

- Docker and Docker Compose
- Git (optional, for cloning the repository)

## Installation and Deployment

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd musicripper-gui
   ```

2. Build and start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the application in your browser at `http://localhost:3000`

### Using Pre-built Docker Image

You can also use the pre-built Docker image from GitHub Packages:

```bash
docker run -d -p 3000:3000 ghcr.io/your-username/musicripper-gui:latest
```

## Usage

1. Open the application in your browser
2. Enter the URL of the music you want to download (YouTube, SoundCloud, etc.)
3. Configure download options:
   - Select if it's a playlist
   - Choose your preferred audio format and quality
   - Enable/disable thumbnail embedding
   - Enable/disable metadata embedding
   - Extract thumbnails in your preferred format
   - Download subtitles in specified languages
   - Embed MusicBrainz metadata for enhanced tagging
   - Download and embed lyrics
   - Add custom yt-dlp arguments
4. Click "Download"
5. Your downloaded files will appear in the "Downloaded Files" section
6. Click the download icon next to any file to download it to your local machine
7. Optionally transfer files to remote servers using the transfer section

## Configuration Options

The application provides several configuration options for music downloading:

- **Audio Format**: MP3, FLAC, M4A, WAV, AAC, OGG, WMA
- **Audio Quality**: Best (0), High (1), Medium (2), Low (3)
- **Embed Thumbnail**: Embed thumbnail image in the audio file
- **Embed Metadata**: Add metadata to the audio file
- **Extract Thumbnail**: Save thumbnail as a separate file
- **Thumbnail Format**: JPG, PNG, or WebP for extracted thumbnails
- **Download Subtitles**: Download available subtitles
- **Subtitle Languages**: Specify languages for subtitles (comma-separated)
- **Embed MusicBrainz Metadata**: Enhance metadata with MusicBrainz database information
- **Download Lyrics**: Download and embed song lyrics
- **Custom Arguments**: Add any additional yt-dlp arguments

## Supported Platforms

This application supports all platforms supported by yt-dlp, including:
- YouTube
- SoundCloud
- Spotify (requires additional setup)
- Bandcamp
- And many more...

For a complete list of supported platforms, visit the [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).

## GitHub Actions Pipeline

This repository includes a GitHub Actions pipeline that automatically builds and pushes Docker images to GitHub Container Registry (GHCR) when:
- Changes are pushed to the main branch
- New tags are created

The pipeline builds images for both AMD64 and ARM64 architectures.

To use the pipeline:
1. Fork this repository
2. Enable GitHub Actions in your fork
3. The pipeline will automatically run on pushes to main or when tags are created

Images are pushed to: `ghcr.io/your-username/musicripper-gui`

## Deployment with Portainer

To deploy with Portainer:
1. In Portainer, go to "Images" and click "Add image"
2. Enter the image name: `ghcr.io/your-username/musicripper-gui:latest`
3. Click "Pull the image"
4. Go to "Containers" and click "Add container"
5. Fill in the container details:
   - Name: musicripper-gui
   - Image: ghcr.io/your-username/musicripper-gui:latest
   - Ports: 3000:3000
   - Volumes: Mount local directories for downloads and config if needed
6. Click "Deploy the container"

## Development

To run the application in development mode:

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. Build the frontend:
   ```bash
   npm run build-frontend
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Building the Docker Image

To build the Docker image manually:
```bash
docker build -t musicripper-gui .
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for the powerful media download capabilities
- [Express.js](https://expressjs.com/) for the web framework
- [React](https://reactjs.org/) for the frontend library
- [MusicBrainz](https://musicbrainz.org/) for the metadata database