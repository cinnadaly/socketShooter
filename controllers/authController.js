//import dependencies
const bcrypt = require('bcrypt');//password
const jwt = require('jsonwebtoken');//token for login
const { msnodesqlv8 } = require('../config/db')
require("dotenv").config();

const { error } = require("node:console")

const login = async (req, res) => {
    try {
        //get login data
        const { username, password } = req.body;
        console.log("user:", username, " with password:", password, "logged in")

        //check fields
        if (!username || !password) {
            return res.status(400).json({
                status: 400,
                errorMessage: "username and password are required"
            });
        }

        // check user in DB
        const result = await msnodesqlv8.query`
            Select * From Users Where Username = ${username}
        `;

        const user = result.recordset[0];

        // validate user
        if (!user) {
            return res.status(401).json({
                status: 401,
                errorMessage: "Invalid Credentials."
            });
        }

        // validate password
        const validPassword = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        if (!validPassword) {
            return res.status(401).json({
                status: 401,
                errorMessage: "Invalid Credentials"
            });
        }

        //token creation
        const token = jwt.sign(
            {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                bestScore: user.BestScore
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "5h"
            }
        );

        //create cookie hhtp only
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        });

        //response
        res.json({
            status: 200,
            message: "Login Success",
            user: {
                id: user.Id,
                username: user.Username
            },
            token: token
        });
    } catch (error) {
        console.error(error);
        //display
        res.status(500).json({
            status: 500,
            errorMessage: "Internal error"
        });
    }
}

const logout = async (req, res) => {
    //destroy cookie
    try {
        res.clearCookie('token');
        res.status(200).json({
            status: 200,
            message: "Logged out successfuly"
        })

    } catch (error) {
        console.error(error)
    }
}

//create token module NOT COOKIE ONLY JWT
const createToken = (user) => {
    return jwt.sign({
        id: user.Id,
        username: user.Username,
        email: user.Email,
        bestScore: user.BestScore
    },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );
};

module.exports = {
    login,
    logout,
    createToken

};
