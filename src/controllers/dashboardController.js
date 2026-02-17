const Study = require('../models/Study');

exports.index = (req, res) => {
    const stats = Study.getStats(req.session.userId);
    const history = Study.getHistory(req.session.userId);
    res.render('dashboard/index', { stats, history, user: req.session.userName });
};
