const https = require('https');

const code = "DSkXdHvDYxM";
const url = `https://www.instagram.com/p/${code}/embed/`;

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("HTML length:", data.length);
    
    // Search for any .jpg, .webp, or .mp4 or scontent links
    const matches = data.match(/https:\/\/[^"'\s]*\.(?:jpg|webp|mp4)[^"'\s]*/g);
    if (matches) {
      console.log("Found matches:");
      const unique = [...new Set(matches)];
      unique.slice(0, 15).forEach(m => console.log(m.substring(0, 150)));
    } else {
      console.log("No media matches found");
    }
  });
}).on('error', (err) => {
  console.error("Error:", err);
});
