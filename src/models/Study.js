const { db } = require('../db/database');

class Study {
    static getNextCard(userId, category = null) {
        const timeNow = Date.now();

        // Priority:
        // 1. Due reviews (next_review <= now)
        // 2. New cards (never seen)

        // Check for due reviews
        let dueQuery = `
            SELECT v.*, up.status, up.interval, up.next_review
            FROM vocabularies v
            JOIN user_progress up ON v.id = up.vocab_id
            WHERE up.user_id = ? AND up.next_review <= ?
        `;
        const dueParams = [userId, timeNow];

        if (category) {
            dueQuery += ' AND v.category = ?';
            dueParams.push(category);
        }

        dueQuery += ' ORDER BY up.next_review ASC LIMIT 1';

        const dueStmt = db.prepare(dueQuery);
        let card = dueStmt.get(...dueParams);

        if (!card) {
            // Get a new card
            let newQuery = `
                SELECT v.* 
                FROM vocabularies v
                LEFT JOIN user_progress up ON v.id = up.vocab_id AND up.user_id = ?
                WHERE up.vocab_id IS NULL
            `;
            const newParams = [userId];

            if (category) {
                newQuery += ' AND v.category = ?';
                newParams.push(category);
            }

            newQuery += ' ORDER BY RANDOM() LIMIT 1';

            const newStmt = db.prepare(newQuery);
            card = newStmt.get(...newParams);

            if (card) {
                card.status = 'new';
                card.interval = 0;
            }
        }

        return card;
    }

    static getProgress(userId, vocabId) {
        const stmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND vocab_id = ?');
        return stmt.get(userId, vocabId);
    }

    static updateProgress(userId, vocabId, status, interval, next_review, last_review) {
        const stmt = db.prepare(`
            INSERT INTO user_progress (user_id, vocab_id, status, interval, next_review, last_review)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, vocab_id) DO UPDATE SET
                status = excluded.status,
                interval = excluded.interval,
                next_review = excluded.next_review,
                last_review = excluded.last_review
        `);
        stmt.run(userId, vocabId, status, interval, next_review, last_review);
    }

    static submitReview(userId, vocabId, rating) {
        // ... existing logic ...
        // rating: 'known' (easy), 'unknown' (hard)
        const timeNow = Date.now();

        let progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND vocab_id = ?').get(userId, vocabId);

        let interval = 0;
        let nextReview = 0;
        let status = 'learning';

        if (progress) {
            interval = progress.interval;
        }

        if (rating === 'known') {
            if (interval === 0) interval = 1; // 1 day
            else if (interval === 1) interval = 3;
            else if (interval === 3) interval = 7;
            else if (interval === 7) interval = 14;
            else interval = Math.ceil(interval * 2.5); // SM-2 simplified

            status = 'reviewing';
        } else {
            interval = 0; // Reset
            status = 'learning';
        }

        // nextReview is current time + interval in days (converted to ms)
        // If interval is 0 (learning/reset), set to now (or maybe +1 min? for now keep it 0 effectively immediate)
        // But requested logic says "Belum hafal -> ulangi besok" or "muncul lebih cepat". 
        // Let's follow the requirement:
        // Belum hafal -> ulangi besok (interval 1 day? or same day?)
        // Actually requirement says: "Belum hafal -> muncul lebih cepat". "Sudah hafal -> interval diperpanjang".
        // Example rules: Belum hafal -> besok. Hafal 1 -> 3 hari. 
        // Let's stick to the example in requirements if possible, or my valid SM2 interpretation.
        // Req: "Belum hafal -> ulangi besok". So interval = 1 if unknown.

        if (rating === 'unknown') {
            interval = 1; // Besok
            status = 'learning';
        }

        nextReview = timeNow + (interval * 24 * 60 * 60 * 1000);

        if (progress) {
            db.prepare(`
                UPDATE user_progress 
                SET status = ?, last_review = ?, next_review = ?, interval = ?
                WHERE user_id = ? AND vocab_id = ?
            `).run(status, timeNow, nextReview, interval, userId, vocabId);
        } else {
            db.prepare(`
                INSERT INTO user_progress (user_id, vocab_id, status, last_review, next_review, interval)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(userId, vocabId, status, timeNow, nextReview, interval);
        }
    }

    static getStats(userId) {
        const totalVocab = db.prepare('SELECT COUNT(*) as count FROM vocabularies').get().count;

        const learned = db.prepare(`
            SELECT COUNT(*) as count FROM user_progress 
            WHERE user_id = ? AND interval > 0
        `).get(userId).count;

        const notLearned = totalVocab - learned; // Simplified

        // Or more distinct:
        // Total available
        // Total memorized (interval > some threshold? or just status?)
        // Let's use status != 'new' as "studied". 
        // 'known' vs 'unknown' in current state?

        const studied = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?').get(userId).count;

        // "Jumlah hafal" -> maybe interval > 3? or just NOT 'learning'?
        // Let's say interval >= 3 is "hafal" for the stats
        const memorized = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND interval >= 3').get(userId).count;
        const stillLearning = studied - memorized;

        return {
            totalVocab,
            studied,
            memorized,
            stillLearning,
            progressPercentage: Math.round((memorized / totalVocab) * 100)
        };
    }

    static getHistory(userId) {
        return db.prepare(`
            SELECT v.word, v.meaning, up.last_review, up.status
            FROM user_progress up
            JOIN vocabularies v ON up.vocab_id = v.id
            WHERE up.user_id = ?
            ORDER BY up.last_review DESC
            LIMIT 10
        `).all(userId);
    }
}

module.exports = Study;
