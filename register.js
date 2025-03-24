const http = require('http');
const url = require('url');
const mysql = require('mysql');
const crypto = require('crypto');
const fs = require('fs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Thay bằng user MySQL của bạn
    password: '', // Thay bằng password MySQL của bạn
    database: 'web'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

const server = http.createServer((req, res) => {
    // Thêm header CORS để tránh lỗi
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý preflight request của CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { username, emailuser, passworduser, passwordconfirm } = JSON.parse(body);

            if (passworduser !== passwordconfirm) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Passwords do not match' }));
            }

            const hashedPassword = crypto.createHash('md5').update(passworduser).digest('hex');
            const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const query = 'INSERT INTO users (full_name, email, password, created_at) VALUES (?, ?, ?, ?)';
            connection.query(query, [username, emailuser, hashedPassword, createdAt], (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'Database error' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Registration successful' }));
            });
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
