/**
 * 本地开发服务器
 * 用于本地预览和测试
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // 处理根路径
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // 获取文件扩展名
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`服务器错误: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 本地服务器已启动！');
  console.log('========================================');
  console.log(`\n访问地址: http://localhost:${PORT}`);
  console.log('\n提示:');
  console.log('  1. 如果看不到数据，请先运行: npm run fetch');
  console.log('  2. 按 Ctrl+C 停止服务器');
  console.log('\n========================================\n');
});
