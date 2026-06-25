//import dependencies
const express = require('express');
const router = express.Router();
const { registerUser, getAllUser, getUserById, deleteUser, updateProfile, deleteProfile } = require('../controllers/userController')
const { authMiddleware } = require('../middlewares/authMiddleware')
//const {checkRoleMiddleware} = require('../middlewares/checkRoleMiddleware');
//const { addMessage } = require('../controllers/chatController');

//insert user (all)
router.post('/register', registerUser);

//get all users (admin)(moderator)
router.get('/users', authMiddleware, getAllUser);

//get user by id (admin)(moderator)
router.get('/users/:id', authMiddleware, getUserById);

//get user by id (admin)(moderator)
//router.get('/admin', authMiddleware, checkRoleMiddleware(["Admin"]), getAdmin);

//delete user (admin)(moderator)
router.delete('/users/:id', authMiddleware, deleteUser);

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username,
        bestScore: req.user.bestScore,
        email: req.user.email
    });
});


//for profile

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

router.delete(
    "/profile",
    authMiddleware,
    deleteProfile
);
module.exports = router;