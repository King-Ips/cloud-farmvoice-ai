const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

require('dotenv').config();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function log(level, message, data = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message} ${data}`);
}

http.createServer((req, res) => {
  // Enable CORS for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API PROXY for Gemini (secure API key handling)
  if (req.url === '/api/ask' || req.url === '/api/analyze-image') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!GEMINI_API_KEY) {
      log('ERROR', 'GEMINI_API_KEY not configured');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API not configured' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString().slice(0, 1e6); // Limit to 1MB
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const isImageAnalysis = req.url === '/api/analyze-image';

        const payload = {
          contents: isImageAnalysis
            ? [{
                parts: [
                  { inline_data: { mime_type: 'image/jpeg', data: data.image } },
                  { text: 'Look at this livestock animal. Tell me the breed and colour in one short sentence. Example: "This appears to be a brown Bonsmara cow." If you cannot identify the breed say: "This appears to be a mixed breed animal."' }
                ]
              }]
            : [{
                parts: [{ text: data.question }]
              }]
        };

        if (!isImageAnalysis) {
          payload.system_instruction = {
            parts: [{
              text: 'You are FarmVoice AI, a helpful farming assistant for blind and visually impaired farmers in South Africa. Keep answers short, clear and spoken-friendly. Maximum 2 sentences. No bullet points. No markdown. Speak directly to the farmer.'
            }]
          };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        https.request(new url.URL(apiUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (apiRes) => {
          let apiBody = '';
          apiRes.on('data', chunk => { apiBody += chunk; });
          apiRes.on('end', () => {
            try {
              const result = JSON.parse(apiBody);
              if (result.error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API error: ' + result.error.message }));
                return;
              }
              const text = result.candidates[0].content.parts[0].text.replace(/[*#_`]/g, '').trim();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ response: text }));
            } catch (e) {
              log('ERROR', 'Failed to parse API response:', e.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to parse response' }));
            }
          });
        }).on('error', (e) => {
          log('ERROR', 'API request failed:', e.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Gateway error' }));
        }).end(JSON.stringify(payload));

      } catch (e) {
        log('ERROR', 'Invalid request body:', e.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      log('WARN', 'File not found:', filePath);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });

}).listen(PORT, () => {
  log('INFO', `Server running at http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    log('WARN', 'GEMINI_API_KEY not set. Set it in .env file');
  }
});
