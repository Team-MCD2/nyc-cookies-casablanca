const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, '..', 'public', 'images', 'instagram');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const ACTIVE_IDS = [
  "photo-1499636136210-6f4ee915583e", // Chocolate chip
  "photo-1607958996333-41aef7caefaa", // Gooey triple chocolate
  "photo-1590080875515-8a3a8dc5735e", // Cookie sea salt
  "photo-1516685018646-549198525c1b", // Caramel drip
  "photo-1509440159596-0249088772ff", // Soho signature
  "photo-1587314168485-3236d6710814", // White chocolate
  "photo-1548365328-8c6db3220e4c", // Central park
  "photo-1551024601-bec78aea704b", // Sweet assortments
  "photo-1563729784474-d77dbb933a9e"  // Red velvet
];

const CODES = [
  "DXzdYNltwJk", "DXe16O5AI0t", "DSkXdHvDYxM", "DYXmnjfgdB1", 
  "DQt5uYljeD1", "DOy0dDCDXPg", "DNgJrVOInb8", "DM5kr-wtAKj", 
  "DMc04xGtmwC", "DMSjTFiNEoJ", "DKUfydjoOyh", "DEQdGmIg1Dl", 
  "DAl51IVttnN", "DAipHnLig6Z", "DBJYR8sNKIx", "C8BwCfDtjJh", 
  "C2k_2g5tttu"
];

async function download(code, id) {
  return new Promise((resolve, reject) => {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;
    const filepath = path.join(dir, `${code}.jpg`);
    const file = fs.createWriteStream(filepath);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${code}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${code}.jpg successfully`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("Starting round-robin verified downloads...");
  for (let i = 0; i < CODES.length; i++) {
    const code = CODES[i];
    const id = ACTIVE_IDS[i % ACTIVE_IDS.length];
    try {
      await download(code, id);
    } catch (e) {
      console.error(`Error downloading ${code}:`, e.message);
    }
  }
  console.log("All verified downloads complete!");
}

main();
