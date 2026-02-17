const { db } = require('../db/database');
const bcrypt = require('bcrypt');

class User {
    static create(name, email, password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        try {
            const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
            const info = stmt.run(name, email, hashedPassword);
            return { id: info.lastInsertRowid, name, email };
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                throw new Error('Email already exists');
            }
            throw err;
        }
    }

    static findByEmail(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }

    static findById(id) {
        const stmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
        return stmt.get(id);
    }
}

module.exports = User;
