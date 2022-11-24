const express = require('express');

const authController = require('../controllers/auth');
const auth = require('../middleware/is-auth');

const router = express.Router();

router.get('/report/:email', authController.getUsersReport);
router.post('/login', authController.login);
router.post('/add-user', authController.createUser);
// router.post('/add-user', auth.isAdmin, authController.createUser);

module.exports = router;
