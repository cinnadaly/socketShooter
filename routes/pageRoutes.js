const express = require('express');
const router = express.Router();
const {registerUser, getAllUser, getUserById, deleteUser} = require('../controllers/userController')
const {authMiddleware} = require('../middlewares/authMiddleware')
const path = require('path');
const { gameState } = require("../websocket/socket");

// Servir archivos estáticos desde una carpeta llamada 'public'
router.use(express.static(path.join(__dirname, 'public')));


router.get('/', (req, res) => {
    // __dirname is the directory of the current script
    //res.sendFile(path.join(__dirname, 'public/login.html'));
    res.render('pages/login')
});

router.get('/game', authMiddleware, (req, res) => {
    console.log(req.url);

    const token = req.query.token;
    console.log("token from routes: ", token);
    console.log("Game state from routes: ", gameState);

    const isPlayerInGame = gameState.players.some(
        player => player.userId === req.user.id
    );

    if (!gameState.started || !isPlayerInGame || token !== gameState.token) {
        return res.redirect('/lobby');
    }

    // __dirname is the directory of the current script
    res.render('pages/game',
        {
            user : req.user,
            isGamePage: true
        },
    )
});

router.get('/lobby', authMiddleware, async (req, res) => {
    res.render('pages/lobby',
        {
            user : req.user
        }
    );
});


router.get('/profile', authMiddleware, (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/profile',
        {
            user : req.user
        }
    )
});

router.get('/register', (req, res) => {
    // __dirname is the directory of the current script
    res.render('pages/register')
});

module.exports = router;