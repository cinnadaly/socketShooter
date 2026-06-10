const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findByEmail, createUser } = require('../controllers/userController.js');

passport.use
    (new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            //consts
            //profile es perfil que ha iniciado sesion a traves de google
            const email = profile.emails[0].value;

            //search user by email
            let user = await findByEmail(email);

            const username = email.split("@")[0];

            if (!user) {
                await createUser({
                    //name & emaill
                    username: username,
                    email,
                    passwordHash: null
                });
                user = await findByEmail(email);
            }
            done(null, user);

        } catch (error) {
            done(error, null);
        }
    }
    ));

module.exports = passport;

