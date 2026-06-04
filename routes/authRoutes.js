//import dependencies
const express = require('express');
const router = express.Router();
const {login, logout} = require('../controllers/authController')
const {authMiddleware} = require('../middlewares/authMiddleware')

//login
router.post('/login', login);
//logout
router.post('/logout', logout);

module.exports = router;