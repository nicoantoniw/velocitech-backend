const express = require('express');

const certificateController = require('../controllers/certificate');
const auth = require('../middleware/is-auth');

const router = express.Router();

router.get('/certificate', auth.isCyclist, certificateController.getCertificate);
router.get('/download', auth.isCyclist, certificateController.downloadCertificate);
router.post('/add', auth.isAdmin, certificateController.addCertificate);
router.post('/create-pdf', auth.isAdmin, certificateController.createPDF);

module.exports = router;