//import dependencies
const express = require('express');
const router = express.Router();
const { login, logout, register } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')

//login
router.post('/login', login);
//logout
router.post('/logout', logout);
//register
router.post('/register', register);

module.exports = router;