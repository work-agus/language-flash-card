const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, studyController.studyPage);
router.post('/review', requireLogin, studyController.submitReview);
router.post('/undo', requireLogin, studyController.undoReview);

module.exports = router;
