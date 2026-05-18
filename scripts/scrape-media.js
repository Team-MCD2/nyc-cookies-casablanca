const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer-core');

const imgDir = path.join(__dirname, '..', 'public', 'images', 'instagram');
const vidDir = path.join(__dirname, '..', 'public', 'videos', 'instagram');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir, { recursive: true });

const CODES = [
  "DXzdYNltwJk", "DXe16O5AI0t", "DSkXdHvDYxM", "DYXmnjfgdB1", 
  "DQt5uYljeD1", "DOy0dDCDXPg", "DNgJrVOInb8", "DM5kr-wtAKj", 
  "DMc04xGtmwC", "DMSjTFiNEoJ", "DKUfydjoOyh", "DEQdGmIg1Dl", 
  "DAl51IVttnN", "DAipHnLig6Z", "DBJYR8sNKIx", "C8BwCfDtjJh", 
  "C2k_2g5tttu"
];

// Helper to find valid local executable path
function getExecutablePath() {
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error("No browser executable found (Chrome or Edge).");
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function scrapePost(browser, code) {
  const url = `https://www.instagram.com/p/${code}/embed/captioned/`;
  const page = await browser.newPage();
  
  // Set window size
  await page.setViewport({ width: 800, height: 1000 });
  
  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the media elements to load in the DOM
    await page.waitForSelector('img.EmbeddedMediaImage, img', { timeout: 10000 }).catch(() => {});
    
    // Extract Image and Video URLs from DOM
    const media = await page.evaluate(() => {
      const img = document.querySelector('img.EmbeddedMediaImage') || document.querySelector('img');
      const video = document.querySelector('video');
      return {
        imageUrl: img ? img.src : null,
        videoUrl: video ? video.src : null
      };
    });

    console.log(`[${code}] Extracted imageUrl:`, media.imageUrl ? media.imageUrl.substring(0, 80) + '...' : null);
    console.log(`[${code}] Extracted videoUrl:`, media.videoUrl ? media.videoUrl.substring(0, 80) + '...' : null);

    if (media.imageUrl) {
      const imgPath = path.join(imgDir, `${code}.jpg`);
      await downloadFile(media.imageUrl, imgPath);
      console.log(`[${code}] Image downloaded successfully.`);
    }

    if (media.videoUrl) {
      const vidPath = path.join(vidDir, `${code}.mp4`);
      await downloadFile(media.videoUrl, vidPath);
      console.log(`[${code}] Video downloaded successfully.`);
    }

  } catch (err) {
    console.error(`Error scraping ${code}:`, err.message);
  } finally {
    await page.close();
  }
}

async function main() {
  const executablePath = getExecutablePath();
  console.log("Using browser at:", executablePath);
  
  const browser = await puppeteer.launch({
    executablePath,
    headless: true
  });

  for (const code of CODES) {
    try {
      await scrapePost(browser, code);
    } catch (e) {
      console.error(e);
    }
  }

  await browser.close();
  console.log("Scraping and downloads complete!");
}

main();
