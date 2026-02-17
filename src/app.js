const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDb } = require('./db/database');

const authRoutes = require('./routes/authRoutes');
const vocabRoutes = require('./routes/vocabRoutes');
const studyRoutes = require('./routes/studyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 9000;

// Initialize Database
initDb();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret-key-change-me', // In prod use env var
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/vocab', vocabRoutes);
app.use('/study', studyRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
