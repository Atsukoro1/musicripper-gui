I want a selfhostable gui deployable with docker that will download music like this following script, make full advantage of ytdlp - make it possible to download from youtube, soundcloud and other services and make beautiful GUI. Decide yourself on the tech stack.

```bash
set -euo pipefail
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/config.sh"

TMPDIR=$(mktemp -d)
IS_PLAYLIST=false

# Parse args
while getopts "p" opt; do
  case $opt in
    p) IS_PLAYLIST=true ;;
  esac
done
shift $((OPTIND -1))

URL="$1"

# yt-dlp args
ARGS=(
  -x --audio-format "$AUDIO_FORMAT" --audio-quality "$AUDIO_QUALITY"
  --add-metadata --embed-thumbnail --convert-thumbnails "$THUMB_FORMAT"
  -o "$TMPDIR/%(artist)s - %(title)s.%(ext)s"
)

if [ "$IS_PLAYLIST" = true ]; then
  ARGS+=("--yes-playlist")
else
  ARGS+=("--no-playlist")
fi

echo "🎵 Downloading from YouTube Music: $URL"
yt-dlp "${ARGS[@]}" "$URL"

echo "📤 Copying MP3s to $SERVER_USER@$SERVER_HOST:$SERVER_DIR ..."
if [ -n "$SERVER_PASS" ]; then
  sshpass -p "$SERVER_PASS" scp "$TMPDIR"/*.mp3 "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"
else
  scp "$TMPDIR"/*.mp3 "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"
fi

rm -rf "$TMPDIR"
echo "✅ Done. Files transferred to $SERVER_DIR"
```
