const Study = require('../models/Study');
const Vocabulary = require('../models/Vocabulary');

exports.studyPage = (req, res) => {
    const category = req.query.category || null;
    const card = Study.getNextCard(req.session.userId, category);
    const categories = Vocabulary.getCategories();

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ card });
    }

    // Initialize history if not exists
    if (!req.session.reviewHistory) {
        req.session.reviewHistory = [];
    }

    res.render('study/card', {
        card,
        user: req.session.userName,
        categories,
        currentCategory: category,
        canUndo: req.session.reviewHistory.length > 0
    });
};

exports.submitReview = (req, res) => {
    const { vocabId, rating, category } = req.body; // rating: 'known' | 'unknown'

    // Initialize history if not exists
    if (!req.session.reviewHistory) {
        req.session.reviewHistory = [];
    }

    // Save current state for Undo BEFORE updating
    const currentProgress = Study.getProgress(req.session.userId, vocabId);
    console.log(`[Review] User ${req.session.userId} reviewed ${vocabId}. Pushing to history.`);

    // Add to history stack
    req.session.reviewHistory.push({
        vocabId,
        previousState: currentProgress ? { ...currentProgress } : null,
        timestamp: Date.now()
    });

    // Limit history size (e.g., 50 items)
    if (req.session.reviewHistory.length > 50) {
        req.session.reviewHistory.shift(); // Remove oldest
    }

    // Explicitly save session to ensure persistence before response
    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
    });

    Study.submitReview(req.session.userId, vocabId, rating);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, canUndo: true });
    }

    // Redirect back to study page to get next card, preserving category
    const redirectUrl = category ? `/study?category=${encodeURIComponent(category)}` : '/study';
    res.redirect(redirectUrl);
};

exports.undoReview = (req, res) => {
    if (!req.session.reviewHistory || req.session.reviewHistory.length === 0) {
        return res.status(400).json({ error: 'No action to undo' });
    }

    // Pop the last action
    const lastReview = req.session.reviewHistory.pop();
    const { vocabId, previousState } = lastReview;

    // Restore previous state
    if (previousState) {
        Study.updateProgress(
            previousState.user_id,
            previousState.vocab_id,
            previousState.status,
            previousState.interval,
            previousState.next_review,
            previousState.last_review
        );
    } else {
        // If it was a new card (no progress), delete the progress entry
        const db = require('../db/database').db;
        db.prepare('DELETE FROM user_progress WHERE user_id = ? AND vocab_id = ?').run(req.session.userId, vocabId);
    }

    // Save session after popping
    req.session.save();

    // Fetch the restored card details
    const Vocabulary = require('../models/Vocabulary');
    const restoredCard = Vocabulary.getById(vocabId);

    // Add status info
    if (previousState) {
        const progress = Study.getProgress(req.session.userId, vocabId);
        if (progress) {
            restoredCard.status = 'review';
        } else {
            restoredCard.status = 'new';
        }
    } else {
        restoredCard.status = 'new';
    }

    return res.json({
        card: restoredCard,
        canUndo: req.session.reviewHistory.length > 0
    });
};
