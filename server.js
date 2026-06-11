const express = require("express");
const http = require("http"); //node server
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require('path');
const passport = require("./config/passport");

const authRoutes = require('./routes/authRoutes') //router => authRoutes.js
const userRoutes = require('./routes/userRoutes') //router => userRoutes.js
const pageRoutes = require('./routes/pageRoutes') //router => pageRoutes.js

const { connectDB } = require("./config/db");

//read cookies
const cookieParser = require("cookie-parser");
require("dotenv").config();
//web socket
const { initializeWebSocket } = require("./websocket/socket");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

// Servir archivos estáticos desde una carpeta llamada 'public'
app.use(express.static(path.join(__dirname, 'public')));

// set the view engine to ejs
app.set('view engine', 'ejs');

//front
app.use('/', pageRoutes);

//back
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

//create node SERVER
const server = http.createServer(app);
//socket.io server
initializeWebSocket(server);

//CREATE SERVER
const startServer = async () => {
    //sql server connection
    await connectDB();
    const { sql, msnodesqlv8 } = require("./config/db");

    //initialize websocket
    server.listen(process.env.PORT, () => {
        console.log("servidor iniciado en puerto ", process.env.PORT);
    });
}

startServer();