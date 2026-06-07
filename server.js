const express = require("express");
const http = require("http"); //node server
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require('path');

const authRoutes = require('./routes/authRoutes') //router => authRoutes.js
const userRoutes = require('./routes/userRoutes') //router => userRoutes.js

//read cookies
const cookieParser = require("cookie-parser");
require("dotenv").config();
//db connection
const { connectDB, msnodesqlv8, sql } = require("./config/db");
//web socket
const { initializeWebSocket } = require("./websocket/socket");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(express.static("public"));


app.get('/', (req, res) => {
    // __dirname is the directory of the current script
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/game', (req, res) => {
    // __dirname is the directory of the current script
    res.sendFile(path.join(__dirname, '/public/game.html'));
});

app.get('/profile', (req, res) => {
    // __dirname is the directory of the current script
    res.sendFile(path.join(__dirname, '/public/profile.html'));
});

app.get('/register', (req, res) => {
    // __dirname is the directory of the current script
    res.sendFile(path.join(__dirname, '/public/register.html'));
});


app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

/*
//LOGIN ROUTE
app.post("/login", async (req, res) => {
    try {
        //read login data
        const { email, password } =
            req.body;

        //find user in db
        const result = await sql.query`
            SELECT *
            FROM Users
            WHERE Email = ${email}
        `;
        //first result
        const user = result.recordset[0];

        //user not found
        if (!user) {
            return res.status(401).json({
                status: 401,
                errorMessage: "Invalid credentials"
            });
        }
        //validate password to hashed pwd in db
        const validPassword =
            await bcrypt.compare(
                password,
                user.PasswordHash
            );
        //wrong pwd
        if (!validPassword) {
            return res.status(401).json({
                status: 401,
                errorMessage:
                    "Invalid credentials"
            });
        }
        //ACTIVE = 1 user is online now
        await sql.query`
            UPDATE Users
            SET Active = 1
            WHERE Email = ${email}
        `;
        //create jwt token
        const token = jwt.sign({
            id: user.Id,
            email: user.Email,
            name: user.Name
        },
            process.env.JWT_SECRET
        );
        //create cookie
        res.cookie("token", token, {
            httpOnly: false, //access from frontend
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        });

        console.log(`${user.Email} logged in`);

        //success response
        res.json({
            status: 200,
            message: "Login success",
            user: {
                id: user.Id,
                name: user.Name,
                email: user.Email
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            errorMessage:
                "Internal Server Error"
        });
    }
});
//LOGOUT ROUTE
app.post("/logout", async (req, res) => {
    try {
        //read cookie token
        const token = req.cookies.token;
        //if exists
        if (token) {
            //decode jwt
            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );
            //ACTIVE = 0 user offline
            await sql.query`
                UPDATE Users
                SET Active = 0
                WHERE Email =
                ${decoded.email}
            `;
        }
        //destroy cookie
        res.clearCookie("token");
        //response
        res.json({
            status: 200,
            message: "Logout success"
        });

    } catch (error) {
        console.log(error);
    }
});
*/


//create node SERVER
const server = http.createServer(app);

initializeWebSocket(server);

//CREATE SERVER
const startServer = async () => {
    //sql server connection
    await connectDB();
    //initialize websocket
    server.listen(process.env.PORT, () => {
        console.log("servidor iniciado en puerto ", process.env.PORT);
    });
}

startServer();