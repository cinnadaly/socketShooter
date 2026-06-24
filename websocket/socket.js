const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { msnodesqlv8 } = require("../config/db");
let clients = {};
let isGameStarted = false;
//let restarting = false;
let gameFinished = false;
//vote to restar game
let restartVotes = [];

//save partidas
let currentGameId = null;

//scores
let gameScores = [];

let enemies = [];

let permissionForScores = false;

//GAME functions from server (enemies and bullets)

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function voteRestart() {
    Swal.fire({
        title: "Custom width, padding, color, background.",
        width: 600,
        padding: "3em",
        color: "#716add",
        background: "#fff url(/images/trees.png)",
        backdrop: `
            rgba(0,0,0,0.5)
            url("/images/nyan-cat.gif")
            left top
            no-repeat
        `
    });
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
        if(isGameStarted){
            permissionForScores = true;
        }

        //console.log(wss)
        //wss.clients.forEach((client) => console.log(client.Email))
        try {
            // Check if the limit is exceeded
            
            /*if (wss.clients.size > MAX_CONNECTIONS) {
                ws.close(1013, "Service temporarily overloaded, max connections reached.");
                return;
            }*/

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

            //console.log("user id from jwt ", decoded.id)

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
            /*console.log("---------------------------------------")
            console.log("All USERS")
            /connectedUsers.forEach((user) => {
                console.log(`ID: ${user.userId} Name ${user.name}`)
            })*/

            const currentUser = connectedUsers.filter((u) => {
                //console.log(u.userId, " and ", ws.userId)
                if (u.userId == ws.userId) {
                    return true;
                }
            })
            /*console.log("\n\nCURRENT USER")
            console.log(currentUser[0].userId);
            console.log("---------------------------------------")*/

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

                        /*gameScores.push({
                            userId: ws.userId,
                            score: data.score

                        });*/

                        if (gameScores.length === 2) {
                            //console.log("gameScores.length is 2")
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

                            //clean
                            gameScores = [];
                            currentGameId = null;
                            gameFinished = true;

                            broadcast(
                                {
                                    type: "gameOver",
                                    values: data
                                }
                            )

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

                        connectedUsers.forEach((user) => {
                            //console.log(`ID: ${user.userId} Name ${user.name}`)
                            gameScores.push({
                                userId: user.userId,//current client
                                score: data.score//0
                            });
                        })

                        //SAVE PARTIDA
                        const result = await msnodesqlv8.query`INSERT INTO Games (CreatedAt) 
                        OUTPUT INSERTED.Id
                        VALUES (GETDATE())`;
                        currentGameId = result.recordset[0].Id;

                        console.log("game started: ", currentGameId);
                        //broadcast
                        broadcast(
                            {
                                type: "gameStarted",
                                value: true
                            }
                        )


                    }

                    if (data.type === "enemyHit") {
                        //when enemy eliminated, update scores
                        gameScores.forEach((user, index) => {
                            if(user.userId === ws.userId){
                                console.log("ws.id: ", ws.userId);
                                console.log("previous score: ", gameScores[index].score);
                                gameScores[index].score += 1;
                                console.log("AFTER score: ", gameScores[index].score);
                            }
                        });

                        console.log("NEW SCORE: ", gameScores)

                        broadcast(
                            {
                                type: "enemyHit"
                            }
                        );
                    }


                    //sending response as broadcast to all clients

                    if (data.type === "newPlayer") {
                        //console.log("Nuevo jugador:", ws.id);

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

                    //RESTART
                    if (data.type === "restartGame") {
                        //console.log("Restart requested by", ws.userId);

                        if (!gameFinished) {
                            console.log("Game not finished");
                            return;
                        }

                        if (!restartVotes.includes(ws.userId))
                            restartVotes.push(ws.userId);

                        //console.log("Votes:", restartVotes);

                        if (restartVotes.length === 2) {

                            //clean enemy
                            enemies = [];

                            //new game
                            const result = await msnodesqlv8.query`
                            INSERT INTO Games (CreatedAt)
                            OUTPUT INSERTED.Id
                            VALUES (GETDATE())
                        `;

                            currentGameId = result.recordset[0].Id;

                            //clean scores
                            gameScores = [];
                            gameFinished = false;

                            broadcast({
                                type: "restartGame"
                            });

                            restartVotes = [];
                            //restarting = false;
                        }
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

            /* //when user disconnects
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
             }); */

             async function updateGameIfDisconnected(){
                await msnodesqlv8.query(`
                    UPDATE Games
                    SET ClosedAt = GETDATE()
                    WHERE Id = ${currentGameId}
                `);
             }
            //when user disconnects
            ws.on("close", async () => {

                console.log("CLOSE", ws.userId, new Date().toISOString());

                console.log("player disconnected with: ", currentGameId)
                console.log("NOW THE CLIENTS ARE: ", wss.clients.size);

                if (currentGameId !== null && permissionForScores == true) {
                    console.log("the game ID: ", currentGameId)

                    //console.log(gameScores);

                    let currentPlayerScore = gameScores.filter((gameScore) => {
                        return gameScore.userId == ws.userId;
                    });

                    console.log("current disconnected player score: ", currentPlayerScore);

                    for (const player of gameScores) {
                     //   if(player.userId == ws.userId){
                            //console.log(player.userId, " - ", currentGameId)
                            try{
                                await msnodesqlv8.query(`
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
                                )`);
                                console.log("SCORES REGISTERED FOR DISCONNECTION")
                            }catch (err) {
                                console.error(err);
                            }
                    }
                    //let myself = gameScores.filter((player) => player.userId === ws.userId)
                    //console.log("myself is ")
                    //}


                    await msnodesqlv8.query(`
                        UPDATE Games
                        SET ClosedAt = GETDATE()
                        WHERE Id = ${currentGameId}
                    `);

                    //currentGameId = null;
                    gameFinished = true;
                    gameScores = [];
                    restartVotes = [];
                    enemies = [];
                    /*broadcast({
                        type: "playerDisconnected"
                    });*/

                }

                //broadcast({ type: "playerDisconnected" });
                /* gameScores = [];
                 restartVotes = [];
                 gameFinished = false;
                 enemies = [];*/

                /*if (wss.clients.size < MAX_CONNECTIONS) {
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) { 
                            client.send(JSON.stringify({ type: "waitingForPlayer", value: true })) 
                        }
                    })
                }*/
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

