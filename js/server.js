const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('127.0.0.1+1-key.pem'),
  cert: fs.readFileSync('127.0.0.1+1.pem')
};

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

https.createServer(options, (req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}).listen(8443, () => {
  console.log('Server running at https://127.0.0.1:8443');
});