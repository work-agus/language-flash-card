const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../flashcard.sqlite');
const db = new Database(dbPath); // , { verbose: console.log }

function initDb() {
    // Users Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `).run();

    // Vocabularies Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS vocabularies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            meaning TEXT NOT NULL,
            example TEXT,
            category TEXT NOT NULL,
            level TEXT NOT NULL
        )
    `).run();

    // User Progress Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS user_progress (
            user_id INTEGER,
            vocab_id INTEGER,
            status TEXT DEFAULT 'new',
            last_review INTEGER,
            next_review INTEGER,
            interval INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, vocab_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (vocab_id) REFERENCES vocabularies (id)
        )
    `).run();

    console.log('Database tables initialized.');

    seedVocabularies();
}

function seedVocabularies() {
    const count = db.prepare('SELECT COUNT(*) as count FROM vocabularies').get().count;
    if (count > 0) {
        console.log('Vocabularies already seeded.');
        return;
    }

    const vocabList = [
        // Easy
        { word: 'Apple', meaning: 'Apel', example: 'I eat an apple every day.', category: 'Food', level: 'easy' },
        { word: 'Book', meaning: 'Buku', example: 'She is reading a book.', category: 'Objects', level: 'easy' },
        { word: 'Cat', meaning: 'Kucing', example: 'The cat is sleeping on the sofa.', category: 'Animals', level: 'easy' },
        { word: 'Dog', meaning: 'Anjing', example: 'My dog loves to play fetch.', category: 'Animals', level: 'easy' },
        { word: 'House', meaning: 'Rumah', example: 'They live in a big house.', category: 'Places', level: 'easy' },
        { word: 'Red', meaning: 'Merah', example: 'Her favorite color is red.', category: 'Colors', level: 'easy' },
        { word: 'Run', meaning: 'Lari', example: 'He runs very fast.', category: 'Verbs', level: 'easy' },
        { word: 'Happy', meaning: 'Bahagia', example: 'I am so happy today.', category: 'Emotions', level: 'easy' },
        { word: 'Sun', meaning: 'Matahari', example: 'The sun raises in the east.', category: 'Nature', level: 'easy' },
        { word: 'Water', meaning: 'Air', example: 'Please give me a glass of water.', category: 'Food', level: 'easy' },

        // Medium
        { word: 'Adventure', meaning: 'Petualangan', example: 'They went on an exciting adventure.', category: 'Activities', level: 'medium' },
        { word: 'Beautiful', meaning: 'Indah/Cantik', example: 'The view from the mountain is beautiful.', category: 'Adjectives', level: 'medium' },
        { word: 'Celebrate', meaning: 'Merayakan', example: 'We will celebrate his birthday tomorrow.', category: 'Verbs', level: 'medium' },
        { word: 'Difficult', meaning: 'Sulit', example: 'This math problem is very difficult.', category: 'Adjectives', level: 'medium' },
        { word: 'Environment', meaning: 'Lingkungan', example: 'We must protect our environment.', category: 'Nature', level: 'medium' },
        { word: 'Furniture', meaning: 'Perabotan', example: 'They bought new furniture for the living room.', category: 'Objects', level: 'medium' },
        { word: 'Generous', meaning: 'Dermawan', example: 'He is a generous man who helps the poor.', category: 'Personality', level: 'medium' },
        { word: 'Holiday', meaning: 'Liburan', example: 'We represent going on holiday next week.', category: 'Activities', level: 'medium' },
        { word: 'Important', meaning: 'Penting', example: 'It is important to study hard.', category: 'Adjectives', level: 'medium' },
        { word: 'Journey', meaning: 'Perjalanan', example: 'Life is a long journey.', category: 'Activities', level: 'medium' },

        // Hard
        { word: 'Accomplish', meaning: 'Mencapai/Menyelesaikan', example: 'She worked hard to accomplish her goals.', category: 'Verbs', level: 'hard' },
        { word: 'Benevolent', meaning: 'Baik hati', example: 'The benevolent king helped his people.', category: 'Personality', level: 'hard' },
        { word: 'Cacophony', meaning: 'Suara sumbang/keras', example: 'The workshop was filled with a cacophony of noises.', category: 'Sounds', level: 'hard' },
        { word: 'Debilitate', meaning: 'Melemahkan', example: 'The disease can debilitate the immune system.', category: 'Health', level: 'hard' },
        { word: 'Effervescent', meaning: 'Berbuih/Bersemangat', example: 'She has an effervescent personality.', category: 'Personality', level: 'hard' },
        { word: 'Fastidious', meaning: 'Pemilih/Teliti', example: 'He is fastidious about keeping the house clean.', category: 'Personality', level: 'hard' },
        { word: 'Garrulous', meaning: 'Cerewet/Banyak bicara', example: 'The garrulous old man told us many stories.', category: 'Personality', level: 'hard' },
        { word: 'Hackneyed', meaning: 'Usang/Klise', example: 'That is a hackneyed phrase.', category: 'Language', level: 'hard' },
        { word: 'Iconoclast', meaning: 'Pemberontak (adat/kepercayaan)', example: 'As an iconoclast, he attacked traditional beliefs.', category: 'People', level: 'hard' },
        { word: 'Juxtapose', meaning: 'Menjajarkan (untuk kontras)', example: 'The artist juxtaposed the black and white images.', category: 'Art', level: 'hard' }
    ];

    const insert = db.prepare('INSERT INTO vocabularies (word, meaning, example, category, level) VALUES (@word, @meaning, @example, @category, @level)');

    const insertMany = db.transaction((vocabList) => {
        for (const vocab of vocabList) insert.run(vocab);
    });

    insertMany(vocabList);
    console.log(`Seeded ${vocabList.length} vocabularies.`);
}

module.exports = {
    db,
    initDb
};
