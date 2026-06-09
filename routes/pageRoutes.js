const express = require('express');
const router = express.Router();
const {registerUser, getAllUser, getUserById, deleteUser} = require('../controllers/userController')
const {authMiddleware} = require('../middlewares/authMiddleware')
const path = require('path');

// Servir archivos estáticos desde una carpeta llamada 'public'
router.use(express.static(path.join(__dirname, 'public')));


router.get('/', (req, res) => {
    // __dirname is the directory of the current script
    //res.sendFile(path.join(__dirname, 'public/login.html'));
    res.render('pages/login')
});

router.get('/game', authMiddleware, (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/game')
});

router.get('/lobby', authMiddleware, (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/lobby')
});


router.get('/profile', authMiddleware, (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/profile')
});

router.get('/register', (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/register')
});

module.exports = router;