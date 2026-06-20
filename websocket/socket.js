const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { msnodesqlv8 } = require("../config/db");
let clients = {};
let isGameStarted = false;

//save partidas
let currentGameId = null;

//scores
let gameScores = [];

let enemies = [];

//GAME functions from server (enemies and bullets)

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnEnemy() {

    const enemy = {
        id: crypto.randomUUID(),
        x: randomBetween(25, 475),
        y: randomBetween(-500, -50)
    };

    enemies.push(enemy);
    return enemy;
}


const initializeWebSocket = (server) => {
    //create websocket server
    const wss = new WebSocket.Server({
        server, //attach to express server
        path: "/ws"//route
    });

    //socket connections
    //let activeConnections = 0;
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
            if (wss.clients.size === MAX_CONNECTIONS) {
                broadcast(
                    {
                        type: "lobbyReady",
                        value: true
                    }
                )
                /*wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "startGame",
                            value: true
                        }))
                    }
                })*/
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

            console.log("user id from jwt ", decoded.id)

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
                    message: "Email does not exist"
                }));
                return;
            }
            if (!user) {
                ws.close();
                return;
            }

            //temp id from socket client
            ws.id = decoded.id;
            ws.userId = user.Id;
            ws.email = user.Email;
            ws.name = user.Username;

            const connectedUsers = Array.from(wss.clients)
            console.log("---------------------------------------")
            console.log("All USERS")
            connectedUsers.forEach((user) => {
                console.log(`ID: ${user.userId} Name ${user.name}`)
            })

            const currentUser = connectedUsers.filter((u) => {
                //console.log(u.userId, " and ", ws.userId)
                if (u.userId == ws.userId) {
                    return true;
                }
            })
            console.log("\n\nCURRENT USER")
            console.log(currentUser[0].userId);
            console.log("---------------------------------------")

            //receive messages (listen)
            ws.on("message", async (message) => {
                try {
                    const data = JSON.parse(message);

                    //when some client makes a movement
                    if (data.type === "input") {
                        //console.log(data)
                        //to all clients
                        broadcast(
                            {
                                type: "input",
                                values: data//both clients at a time
                            }
                        )

                    }

                    if (data.type === "gameOver") {
                        //console.log("GAME OVER");
                        //TEST TO SAVE GAME DATA

                        gameScores.push({
                            userId: ws.userId,
                            score: data.score

                        });

                        if (gameScores.length === 2) {

                            await msnodesqlv8.query`
                            UPDATE Games
                            SET ClosedAt = GETDATE()
                            WHERE Id = ${currentGameId}
                        `;


                            for (const player of gameScores) {

                                //console.log("Current Game ID:", currentGameId);

                                //insert scores
                                await msnodesqlv8.query`
                                    INSERT INTO Scores
                                    (
                                        UserId,
                                        GameId,
                                        Score,
                                        CreatedAt
                                    )
                                    VALUES
                                    (
                                        ${player.userId},
                                        ${currentGameId},
                                        ${player.score},
                                        GETDATE()
                                    )
                                `;

                                //insert BEST score
                                //evaluar si es nulo se gaurda actual
                                //si ya tenia scores, pero actual es mayor se guarda actual
                                //si no se cumple lo anterior se queda como estaba
                                await msnodesqlv8.query`
                                UPDATE Users
                                SET BestScore =
                                CASE
                                    WHEN BestScore IS NULL THEN ${player.score}
                                    WHEN BestScore < ${player.score} THEN ${player.score}
                                    ELSE BestScore
                                END
                                Where Id = ${player.userId}
                                    `;
                            }

                            broadcast(
                                {
                                    type: "gameOver",
                                    values: data
                                }
                            )

                            //clean
                            gameScores = [];
                            currentGameId = null;
                        }
                    }

                    if (data.type === "spawnEnemy") {
                        //enemies
                        let newEnemy = spawnEnemy();
                        broadcast(
                            {
                                type: "spawnEnemy",
                                values: data,
                                newEnemy
                            }
                        )
                    }

                    if (data.type === "bullet") {
                        //bullets
                        //console.log(data);
                        broadcast(
                            {
                                type: "bullet",
                                playerId: data.playerId,
                                bullet: data.bullet
                            }
                        )
                    }

                    //when 1 player starts the game
                    //broadcast the redirect to all clients for /game
                    if (data.type === "gameStarted") {

                        isGameStarted = true;

                        //SAVE PARTIDA
                        const result = await msnodesqlv8.query`INSERT INTO Games (CreatedAt) 
                        OUTPUT INSERTED.Id
                        VALUES (GETDATE())`;
                        currentGameId = result.recordset[0].Id;

                        //broadcast
                        broadcast(
                            {
                                type: "gameStarted",
                                value: true
                            }
                        )


                    }

                    if (data.type === "enemyHit") {
                        broadcast(
                            {
                                type: "enemyHit"
                            }
                        );
                    }


                    //sending response as broadcast to all clients

                    if (data.type === "newPlayer") {
                        console.log("Nuevo jugador:", ws.id);

                        //broadcast
                        broadcast(
                            {
                                type: "playerJoined",
                                playerId: ws.id
                            }
                        );
                        /*wss.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: "playerJoined",
                                    playerId: ws.id
                                }));
                            }
                        });*/
                    }

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
                console.log("NOW THE CLIENTS ARE: ", wss.clients.size);
                if (wss.clients.size < MAX_CONNECTIONS) {
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

    //custom broadcast
    function broadcast(message) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(

                    message

                ))
            }
        })
    }

};


module.exports = {
    initializeWebSocket
};

