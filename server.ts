import express from "express";
import { createServer as createViteServer } from "vite";
import ytdl from "@distube/ytdl-core";
import path from "path";
import { fileURLToPath } from "url";
import { execFile, spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get Video Info
  app.get("/api/info", (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Fetching info with yt-dlp for: ${videoUrl}`);

    const isWin = process.platform === "win32";
    const ytDlpFileName = isWin ? "yt-dlp.exe" : "yt-dlp";
    const ytDlpPath = path.join(__dirname, ytDlpFileName);
    const child = spawn(ytDlpPath, ["-J", "--no-warnings", "--no-playlist", videoUrl]);

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("yt-dlp error:", stderrData);
        return res.status(500).json({ error: "Failed to fetch video info", details: stderrData });
      }

      try {
        const info = JSON.parse(stdoutData);

        // Filter formats for video+audio
        const formats = info.formats.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none').map((f: any) => ({
          quality: f.resolution || f.format_note,
          container: f.ext,
          hasVideo: true,
          hasAudio: true,
          itag: f.format_id
        }));

        // Filter formats for audio only
        const audioFormats = info.formats.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none').map((f: any) => ({
          quality: f.abr ? Math.round(f.abr) + "kbps" : "audio",
          container: f.ext,
          itag: f.format_id
        }));

        res.json({
          title: info.title,
          thumbnail: info.thumbnail,
          duration: String(info.duration),
          author: info.uploader,
          formats: formats,
          audioFormats: audioFormats
        });
      } catch (parseError: any) {
        console.error("JSON parse error:", parseError);
        res.status(500).json({ error: "Failed to parse video info" });
      }
    });
  });

  // API Route: Download
  app.get("/api/download", (req, res) => {
    const videoUrl = req.query.url as string;
    const itag = req.query.itag as string;
    const format = req.query.format as string; // 'mp4' or 'mp3'
    const title = req.query.title as string || "video";

    if (!videoUrl) {
      return res.status(400).send("URL is required");
    }

    const safeTitle = title.replace(/[^\w\s]/gi, '').substring(0, 50);
    const filename = `${safeTitle}.${format === 'mp3' ? 'mp3' : 'mp4'}`;

    res.header("Content-Disposition", `attachment; filename="${filename}"`);

    const isWin = process.platform === "win32";
    const ytDlpFileName = isWin ? "yt-dlp.exe" : "yt-dlp";
    const ytDlpPath = path.join(__dirname, ytDlpFileName);

    const formatArg = itag ? itag : (format === 'mp3' ? 'bestaudio' : 'best');
    const args = ["-o", "-", "-f", formatArg, "--no-warnings", videoUrl];

    console.log(`Starting yt-dlp download: ${videoUrl} with format ${formatArg}`);

    const child = spawn(ytDlpPath, args);

    child.stdout.pipe(res);

    child.stderr.on('data', (data) => {
      console.log(`yt-dlp stderr: ${data}`);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) res.status(500).send("Download failed");
      }
    });

    child.on('error', (err) => {
      console.error("Failed to start subprocess.", err);
      if (!res.headersSent) res.status(500).send("Server error starting download");
    });

    req.on('close', () => {
      // Clean up the process if the user cancels the download
      child.kill();
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
