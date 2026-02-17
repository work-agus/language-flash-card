const { db } = require('../db/database');

class Vocabulary {
    static getAll({ search, category, level, limit, offset }) {
        let query = 'SELECT * FROM vocabularies WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (word LIKE ? OR meaning LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (level) {
            query += ' AND level = ?';
            params.push(level);
        }

        // Count total for pagination
        const countStmt = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
        const total = countStmt.get(...params).count;

        query += ' ORDER BY word ASC LIMIT ? OFFSET ?';
        params.push(limit || 10, offset || 0);

        const stmt = db.prepare(query);
        const data = stmt.all(...params);

        return { data, total };
    }

    static getById(id) {
        const stmt = db.prepare('SELECT * FROM vocabularies WHERE id = ?');
        return stmt.get(id);
    }

    static getCategories() {
        const stmt = db.prepare('SELECT DISTINCT category FROM vocabularies ORDER BY category');
        return stmt.all().map(row => row.category);
    }
}

module.exports = Vocabulary;
