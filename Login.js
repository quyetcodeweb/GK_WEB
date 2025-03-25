const http = require("http");
const mysql = require("mysql");
const qs = require("querystring");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Connect to MySQL
db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "web"
});

db.connect(err => {
    if (err) {
        console.error("Unable to connect to database: " + err.stack);
        return;
    }
    console.log("Connected to MySQL successfully");
});

// Create server
const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
        fs.readFile(path.join(__dirname, "login.html"), (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error, please try again later.");
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
            }
        });
    } else if (req.method === "GET" && req.url === "/LoginStyle.css") {
        fs.readFile(path.join(__dirname, "LoginStyle.css"), (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Unable to load CSS file.");
            } else {
                res.writeHead(200, { "Content-Type": "text/css" });
                res.end(data);
            }
        });
    } else if (req.method === "POST" && req.url === "/login") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const postData = qs.parse(body);
            const { email, password } = postData;

            if (!email || !password) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Email and password are required." }));
                return;
            }

            const query = "SELECT * FROM users WHERE email = ?";
            db.query(query, [email], (err, results) => {
                if (err) {
                    console.error("Database query error:", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, message: "System error, please try again later." }));
                    return;
                }

                if (results.length === 0) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, message: "Email does not exist in the system." }));
                    return;
                }

                const hashedPassword = results[0].password;
                const inputPasswordHash = crypto.createHash("md5").update(password).digest("hex");

                if (inputPasswordHash === hashedPassword) {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, message: "Incorrect password." }));
                }
            });
        });
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Requested page not found.");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
