const Vocabulary = require('../models/Vocabulary');

exports.list = (req, res) => {
    const { search, category, level, page } = req.query;
    const limit = 10;
    const offset = ((page || 1) - 1) * limit;

    const { data: vocabularies, total } = Vocabulary.getAll({
        search, category, level, limit, offset
    });

    const categories = Vocabulary.getCategories();
    const totalPages = Math.ceil(total / limit);

    res.render('vocab/list', {
        vocabularies,
        categories,
        currentPage: parseInt(page) || 1,
        totalPages,
        search,
        category,
        level,
        user: req.session.userName
    });
};

exports.detail = (req, res) => {
    const vocab = Vocabulary.getById(req.params.id);
    if (!vocab) return res.redirect('/vocab');
    res.render('vocab/detail', { vocab, user: req.session.userName });
};
