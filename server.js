const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./users.db');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);

// Register endpoint
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.json({ success: false, message: 'All fields are required.' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (row) {
            return res.json({ success: false, message: 'Email already registered.' });
        }
        const hash = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function (err) {
            if (err) return res.json({ success: false, message: 'Registration failed.' });
            res.json({ success: true });
        });
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (!user) return res.json({ success: false, message: 'Invalid email or password.' });
        if (!bcrypt.compareSync(password, user.password)) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }
        res.json({ success: true, username: user.username });
    });
});

// Serve index.html and login.html
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));