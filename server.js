const http = require('http');
const register = require('./register');
const login = require('./Login');

const server = http.createServer((req, res) => {
    if (req.url === '/register') {
        register(req, res);
    } else if (req.url === '/Login') {
        login(req, res);
    } else {
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
