import { createServer, IncomingMessage, ServerResponse } from 'http';
import mysql, { Connection, FieldPacket, OkPacket } from 'mysql2';

// Kết nối MySQL
const db: Connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Thay bằng user MySQL của m
    password: '', // Thay bằng password MySQL của m
    database: 'web', // Thay bằng tên database của m
});

// Kết nối cơ sở dữ liệu
db.connect((err: mysql.QueryError | null) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Tạo server
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Thêm header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý request OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Route GET: Lấy danh sách bài viết
    if (req.method === 'GET' && req.url === '/posts') {
        const query = `
            SELECT posts.id, posts.title, posts.body, users.username, posts.liked, posts.created_at 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `;

        db.query(query, (err: mysql.QueryError | null, results: any[], fields?: FieldPacket[]) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Database error', details: err }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });

    // Route POST: Đăng bài viết mới
    } else if (req.method === 'POST' && req.url === '/posts') {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { user_id, title, body: content } = JSON.parse(body);

                if (!user_id || !title || !content) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const query = `INSERT INTO posts (user_id, title, body, liked, created_at) VALUES (?, ?, ?, 0, NOW())`;

                db.query(
                    query,
                    [user_id, title, content],
                    (err: mysql.QueryError | null, result: OkPacket) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Database insert error', details: err }));
                            return;
                        }

                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            id: result.insertId,
                            user_id,
                            title,
                            body: content,
                            liked: 0,
                            created_at: new Date(),
                        }));
                    }
                );
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });

    // Route POST: Like/Unlike bài viết
    } else if (req.method === 'POST' && req.url?.startsWith('/like/')) {
        const postId = req.url.split('/')[2];

        if (!postId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Post ID is required' }));
            return;
        }

        // Lấy trạng thái like hiện tại
        const checkQuery = `SELECT liked FROM posts WHERE id = ?`;
        db.query(checkQuery, [postId], (err, results: any[]) => {
            if (err || results.length === 0) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Database error', details: err }));
                return;
            }

            const currentLiked = results[0].liked;
            const newLiked = currentLiked === 1 ? 0 : 1;

            // Cập nhật trạng thái like
            const updateQuery = `UPDATE posts SET liked = ? WHERE id = ?`;
            db.query(updateQuery, [newLiked, postId], (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Database update error', details: err }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ postId, liked: newLiked }));
            });
        });

    // Route không tồn tại
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Chạy server trên port 3000
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
