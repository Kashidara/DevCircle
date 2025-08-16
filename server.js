const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost/devcircle', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    pfp: String
});
const postSchema = new mongoose.Schema({
    user: { username: String, pfp: String },
    text: String,
    img: String,
    comments: [{ user: { username: String }, text: String }],
    timestamp: Number
});
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.json({ success: false, message: 'All fields required.' });
    if (await User.findOne({ email })) return res.json({ success: false, message: 'Email already registered.' });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hash });
    res.json({ success: true });
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.json({ success: false, message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user._id }, 'SECRET');
    res.json({ success: true, token, user: { username: user.username, email: user.email, pfp: user.pfp } });
});

// Middleware to check JWT
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false });
    try {
        req.user = jwt.verify(token, 'SECRET');
        next();
    } catch {
        res.status(401).json({ success: false });
    }
}

// Get posts
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
});

// New post
app.post('/api/posts', auth, async (req, res) => {
    const { text, img } = req.body;
    const user = await User.findById(req.user.id);
    const post = await Post.create({
        user: { username: user.username, pfp: user.pfp },
        text, img, comments: [], timestamp: Date.now()
    });
    res.json(post);
});

// Comment
app.post('/api/posts/:id/comment', auth, async (req, res) => {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: { username: user.username }, text });
    await post.save();
    res.json(post);
});

// Update profile
app.post('/api/profile', auth, async (req, res) => {
    const { username, pfp } = req.body;
    const user = await User.findById(req.user.id);
    if (username) user.username = username;
    if (pfp) user.pfp = pfp;
    await user.save();
    res.json({ success: true, user: { username: user.username, email: user.email, pfp: user.pfp } });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));