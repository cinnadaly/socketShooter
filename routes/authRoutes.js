//import dependencies
const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const passport = require("../config/passport");
const { createToken } = require('../controllers/authController');

//login
router.post('/login', login);
//logout
router.post('/logout', logout);

//OAUTH2
router.get('/google', passport.authenticate(
    "google",
    {
        scope: ["profile", "email"],
        session: false
    }
))

//callback
/*router.get("/google/callback", passport.authenticate("google",
    {
        failureRedirect: "/"
    }), (req, res) => {
        //token
        const token = createToken(req.user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        });

        res.redirect("/lobby");
    }
);*/
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/",
        session: false
    }),
    (req, res) => {
        const token = createToken(req.user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        });

        res.redirect("/lobby");
    }
);

module.exports = router;