import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === "win32";
const binaryName = isWin ? "yt-dlp.exe" : "yt-dlp";
const binaryUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;
const destPath = path.join(__dirname, binaryName);

console.log(`Downloading yt-dlp binary for ${process.platform} from ${binaryUrl}...`);

const file = fs.createWriteStream(destPath);

https.get(binaryUrl, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('yt-dlp downloaded completely.');
                // Make executable on Linux/Mac
                if (!isWin) {
                    fs.chmodSync(destPath, '755');
                    console.log('Made yt-dlp executable.');
                }
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            console.error(`Error downloading: ${err.message}`);
        });
    } else {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('yt-dlp downloaded completely.');
            if (!isWin) {
                fs.chmodSync(destPath, '755');
                console.log('Made yt-dlp executable.');
            }
        });
    }
}).on('error', (err) => {
    fs.unlink(destPath, () => { });
    console.error(`Error downloading: ${err.message}`);
});
