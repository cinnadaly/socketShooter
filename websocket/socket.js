const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { msnodesqlv8 } = require("../config/db");
let clients = {};

const initializeWebSocket = (server) => {
    //create websocket server
    const wss = new WebSocket.Server({
        server, //attach to express server
        path: "/ws"//route
    });

    //socket connections
    let activeConnections = 0;
    const MAX_CONNECTIONS = 2;

    //state of players
    let gameState = { 
        players: [
            {}
        ]
    }

    //assign an id to the websocket connection (increase by)
    let nextId = 0;
           
    //when user connects
    wss.on("connection", async (ws, req) => {
        console.log("socket io server started")

        //console.log(wss)
        //wss.clients.forEach((client) => console.log(client.Email))
        try {
            // Check if the limit is exceeded
            if (wss.clients.size > MAX_CONNECTIONS) {
                ws.close(1013, "Service temporarily overloaded, max connections reached.");
                return;
            }

            //if max connections limit reached, broadcast start the game
            if(wss.clients.size === MAX_CONNECTIONS){
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "startGame",
                            value: true
                        }))
                    }
                })
            }
            console.log(`New connection established. Total: ${wss.clients.size}`);

            //read cookies
            const cookies = cookie.parse(req.headers.cookie || "");
            //read token cookie
            const token = cookies.token;
            //if no token, reject connection
            if (!token) {
                ws.close();
                return;
            }

            //verify jwt token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            //find user in db
            const result = await msnodesqlv8.query`
                SELECT *
                FROM Users
                WHERE Email = ${decoded.email}
            `;
            //get user
            const user = result.recordset[0];

            //EMAIL DOES NOT EXIST
            if (!user) {

                ws.send(JSON.stringify({
                    type: "error",
                    message:
                        "Email does not exist"
                }));
                return;
            }
            if (!user) {
                ws.close();
                return;
            }

            //save connected user
            //clients[user.Email.toLowerCase()] = ws;
            //clients[user.Id.toLowerCase()] = ws;

            
            //temp id from socket client
            ws.id = randomUUID();
            ws.userId = user.Id;
            ws.email = user.Email;
            ws.name = user.Username;

            const connectedUsers = Array.from(wss.clients)
                console.log("---------------------------------------")
                console.log("All USERS")
            connectedUsers.forEach((user) => {
                console.log(`ID: ${user.userId} Name ${user.name}`  )
            })

            const currentUser = connectedUsers.filter((u) => {
                //console.log(u.userId, " and ", ws.userId)
                if(u.userId == ws.userId){
                    return true;
                }
            })
            console.log("\n\nCURRENT USER")
            console.log(currentUser[0].userId);
            console.log("---------------------------------------")

            /*wss.clients.forEach((client) => {
                console.log({
                    id: client.userId,
                    name: client.name,
                    email: client.email
                })
            })*/

            /*console.log(`${user.Email} connected`);
            console.log(`${user.Id} is the ID`);*/

            //receive messages (listen)
            ws.on("message", (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if(data.type === "newPlayer"){
                        console.log("my newPlayer action id is ", ws.id);
                        gameState.players.push({ 
                            tempId: ws.id,
                            userId: ws.userId,
                            x: 250, 
                            y: 250, 
                            width: 25, 
                            height: 25 
                        })
                        console.log(gameState.players)
                    }

                    if(data.type === "input"){
                        let keys = Object.entries(data.keys)
                        //console.log(keys);
                        //currentKey = keys.filter((key) => key === true)
                        //console.log(currentKey);
                    }

                    /*console.log(
                        "MESSAGE:",
                        data
                    );*/

                    //sending response as broadcast to all clients
                    ws.on("message", (message) => {
                        const data = JSON.parse(message.toString());

                        if (data.type === "newPlayer") {
                            console.log("Nuevo jugador:", ws.id);

                            wss.clients.forEach((client) => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({
                                        type: "playerJoined",
                                        playerId: ws.id
                                    }));
                                }
                            });
                        }
                    });

                        /*
                    //if target exists and socket open (connected)
                    if (target && target.readyState === WebSocket.OPEN) {
                        //send message to receiver
                        target.send(JSON.stringify({
                            type: "message",
                            from: data.from,
                            to: data.to,
                            text: data.text
                        }));

                    } else {
                        //user offline
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "User not connected"
                        }));
                    }*/

                } catch (error) {
                    console.log(error);
                }
            });

            //when user disconnects
            ws.on("close", () => {
                console.log("NOW THE CLIENTS ARE: " ,wss.clients.size);
                if(wss.clients.size < MAX_CONNECTIONS){
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "waitingForPlayer",
                                value: true
                            }))
                        }
                    })
                }

                //remove from connected users
                delete clients[
                    user.Email.toLowerCase()
                ];

                console.log(`${user.Email} disconnected`);
            });

        } catch (error) {

            console.log(error.message);

            ws.close();
        }
    });
};

module.exports = {
    initializeWebSocket
};

