const Vocabulary = require('../models/Vocabulary');

exports.list = (req, res) => {
    const { search, category, level, page } = req.query;
    const limit = 10;
    const offset = ((page || 1) - 1) * limit;

    const { data: vocabularies, total } = Vocabulary.getAll({
        search, category, level, limit, offset
    });

    // The original code calculated totalPages here.
    // The requested change implies a 'result' object might be used,
    // but without changing the Vocabulary.getAll call, 'result' is not defined.
    // Assuming the intent is to calculate totalPages based on 'total' from Vocabulary.getAll
    // and pass 'vocabularies' directly, while adding 'path'.
    // The snippet provided for the render object seems to imply a different structure for vocabularies and totalPages,
    // but the surrounding context in the snippet still has the original variable declarations.
    // To make the code syntactically correct and incorporate the explicit changes:
    // 1. Add `path: '/vocab'`.
    // 2. Use `vocabularies` directly (as `data: vocabularies` already extracts it).
    // 3. Calculate `totalPages` from `total`.
    // 4. Use `page` directly for `currentPage`.
    // 5. Pass `categories: Vocabulary.getCategories()` directly in the render object.

    const totalPages = Math.ceil(total / limit); // Keep this calculation based on 'total'

    res.render('vocab/list', {
        vocabularies, // Use the vocabularies extracted from Vocabulary.getAll
        categories: Vocabulary.getCategories(), // Move getCategories directly into the render object
        currentPage: parseInt(page) || 1, // Keep original currentPage logic for robustness
        totalPages, // Use the calculated totalPages
        search,
        category,
        level,
        user: req.session.userName,
        path: '/vocab' // Add the path variable
    });
};

exports.detail = (req, res) => {
    const vocab = Vocabulary.getById(req.params.id);
    if (!vocab) return res.redirect('/vocab');
    res.render('vocab/detail', { vocab, user: req.session.userName });
};
