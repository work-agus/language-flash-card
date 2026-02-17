const Study = require('../models/Study');

exports.index = (req, res) => {
    const stats = Study.getStats(req.session.userId);
    // Limit history for dashboard
    const history = req.session.reviewHistory ? req.session.reviewHistory.slice(-5).reverse() : [];

    // Add path for active navigation state
    res.render('dashboard/index', { stats, history, user: req.session.userName, path: '/dashboard' });
};
