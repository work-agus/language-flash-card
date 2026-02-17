const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.registerPage = (req, res) => {
    res.render('auth/register', { error: null });
};

exports.register = (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = User.create(name, email, password);
        req.session.userId = user.id;
        req.session.userName = user.name;
        res.redirect('/dashboard');
    } catch (err) {
        res.render('auth/register', { error: err.message });
    }
};

exports.loginPage = (req, res) => {
    res.render('auth/login', { error: null });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    const user = User.findByEmail(email);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.userName = user.name;
        res.redirect('/dashboard');
    } else {
        res.render('auth/login', { error: 'Invalid email or password' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};
