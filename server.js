const http = require('http');
const mysql = require('mysql');
const crypto = require('crypto');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Xử lý POST cho trang đăng ký
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const { username, passworduser, passwordconfirm } = JSON.parse(body);

            if (passworduser !== passwordconfirm) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Passwords do not match' }));
            }

            const hashedPassword = crypto.createHash('md5').update(passworduser).digest('hex');
            const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const defaultRole = 'user';

            const query = 'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)';
            connection.query(query, [username, hashedPassword, defaultRole, createdAt], (err, result) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'Database error' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Registration successful' }));
            });
        });
    } 
    
    // Xử lý POST cho trang đăng nhập
    else if (req.method === 'POST' && req.url === '/Login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            let data;
            try {
                data = JSON.parse(body);
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Invalid JSON format' }));
            }

            const { username, password } = data;

            const query = 'SELECT * FROM users WHERE username = ?';
            connection.query(query, [username], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
                }

                if (results.length === 0) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Username not found' }));
                }

                const hashedPassword = results[0].password;
                const inputHashed = crypto.createHash('md5').update(password).digest('hex');

                if (hashedPassword === inputHashed) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Login successful' }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
                }
            });
        });
    } 
    
    // Nếu không phải POST cho đăng ký hoặc đăng nhập
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
