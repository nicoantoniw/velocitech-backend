const express = require('express');

const csvController = require('../controllers/csv');
const auth = require('../middleware/is-auth');

const router = express.Router();

router.get('/csv', auth.isAdmin, csvController.getCSVs);
router.get('/download/:key', auth.isAdmin, csvController.downloadCsv);
router.post('/add', auth.isPCC, csvController.addCSV);

module.exports = router;