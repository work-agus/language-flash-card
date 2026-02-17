const express = require('express');
const router = express.Router();
const vocabController = require('../controllers/vocabController');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, vocabController.list);
router.get('/:id', requireLogin, vocabController.detail);

module.exports = router;
