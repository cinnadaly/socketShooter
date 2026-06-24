const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { msnodesqlv8 } = require("../config/db");
let clients = {};

let restartVotes = [];
let permissionForScores = false;
let scoresSaved = false;

let gameState = {
    started: false,
    finished: false,
    gameId: null,
    players: [],
    enemies: [],
    gameToken: null
};

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
        id: randomUUID(),
        x: randomBetween(25, 475),
        y: randomBetween(-500, -50)
    };
    gameState.enemies.push(enemy);
    return enemy;
}


const initializeWebSocket = (server) => {
    //create websocket server
    const wss = new WebSocket.Server({
        server, //attach to express server
        path: "/ws"//route
    });

    //socket connections
    const MAX_CONNECTIONS = 2;

    //assign an id to the websocket connection (increase by)
    let nextId = 0;

    //when user connects
    wss.on("connection", async (ws, req) => {
        console.log("socket io server started")

        //if(gameState.started){
            permissionForScores = true;
        //}

        scoresSaved = false;

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

            //remove duplicated players
            const alreadyExists = gameState.players.find(
                p => p.userId === ws.userId
            );

            if (!alreadyExists) {
                gameState.players.push({
                    userId: ws.userId,
                    username: ws.name,
                    score: 0
                });
            }

            /*const currentUser = connectedUsers.filter((u) => {
                //console.log(u.userId, " and ", ws.userId)
                if (u.userId == ws.userId) {
                    return true;
                }
            })*/

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
                        console.log("GAME OVER");
                        console.log("players quantity: ", gameState.players.length);
                        if (gameState.players.length === 2){

                            //verify if scores has been saved before
                            if (scoresSaved) {
                                return;
                            }
                            scoresSaved = true;

                            //console.log("gameScores.length is 2")
                            await msnodesqlv8.query`
                            UPDATE Games
                            SET ClosedAt = GETDATE()
                            WHERE Id = ${gameState.gameId}
                        `;

                            for (const player of gameState.players) {

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
                                        ${gameState.gameId},
                                        ${player.score},
                                        GETDATE()
                                    )
                                `;

                                //insert BEST score
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
                            //gameScores = [];
                            gameState.gameId = null;
                            gameState.finished = true;
                            console.log(gameState.players);

                            Array.from(wss.clients).forEach((client, index) => {
                                client.send(JSON.stringify({
                                    type: "gameOver",
                                    score: gameState.players[index].score,
                                    values: data
                                }))
                            });

                            /*wss.clients.forEach((client, index) => {
                                client.send(JSON.stringify({
                                    type: "gameOver",
                                    score: gameState.players[index].score,
                                    values: data
                                }))*/
                               /*console.log(index);
                            })*/

                            /*
                            broadcast(
                                {
                                    type: "gameOver",
                                    score: gameState.players[0].score,
                                    values: data
                                }
                            )*/

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
                        gameState.started = true;
                        gameState.finished = false;
                        //unique token for current game 
                        gameState.token = randomUUID();
                        //restart the score for all players
                        gameState.players.forEach(player => {
                            player.score = 0;
                        });
                        //SAVE PARTIDA
                        const result = await msnodesqlv8.query`INSERT INTO Games (CreatedAt) 
                        OUTPUT INSERTED.Id
                        VALUES (GETDATE())`;
                        gameState.gameId = result.recordset[0].Id;

                        console.log("game started: ", gameState.gameId);
                        //broadcast
                        broadcast(
                            {
                                type: "gameStarted",
                                token: gameState.token,
                                value: true
                            }
                        )
                    }

                    if (data.type === "enemyHit") {
                        //when enemy eliminated, update score for the client that made the kill
                        const player = gameState.players.find(
                            p => p.userId === data.playerId
                        )

                        if (player) {
                            player.score = data.score
                        }
                        console.log(player);
                        //for hit sound
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
                    }

                    //RESTART
                    if (data.type === "restartGame") {

                        scoresSaved = false;

                        console.log("gameSTATE FINISHED: ", gameState.finished);
                        if (!gameState.finished) {
                            console.log("Game not finished");
                            return;
                        }

                        if (!restartVotes.includes(ws.userId))
                            restartVotes.push(ws.userId);

                        console.log("Votes:", restartVotes);

                        if (restartVotes.length === 2) {

                            //clean enemy
                            gameState.enemies = [];

                            //new game
                            const result = await msnodesqlv8.query`
                            INSERT INTO Games (CreatedAt)
                            OUTPUT INSERTED.Id
                            VALUES (GETDATE())
                        `;

                            gameState.gameId = result.recordset[0].Id;

                            //clean current scores
                            gameState.players.forEach(player => {
                                player.score = 0;
                            });
                            gameState.finished = false;

                            broadcast({
                                type: "restartGame"
                            });

                            restartVotes = [];
                        }
                    }

                    //when any player disconnects, game is over and scores are registered
                    if(data.type === "playerDisconnected"){
                        console.log("TRIED TO MAKE THE SCORE REGISTER: ", wss.clients.size)
                        console.log("only 1 CLIENTS");
                        console.log("permission is: ", permissionForScores);
                        console.log("scoresSaved is: ", scoresSaved);

                        if (gameState.gameId !== null && permissionForScores === true) {
                            console.log("the game ID: ", gameState.gameId)
                            console.log( "SCORES: ", gameState.players);

                            if (scoresSaved) {
                                return;
                            }

                            scoresSaved = true;

                            for (const player of gameState.players) {
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
                                            ${gameState.gameId},
                                            ${player.score},
                                            GETDATE()
                                        )`);
                                        console.log("SCORES REGISTERED FOR DISCONNECTION")
                                    }catch (err) {
                                        console.error(err);
                                    }
                            }

                            await msnodesqlv8.query(`
                                UPDATE Games
                                SET ClosedAt = GETDATE()
                                WHERE Id = ${gameState.gameId}
                            `);

                            //currentGameId = null;
                            gameState.finished = true;
                            //gameScores = [];
                            restartVotes = [];
                            enemies = [];
                            gameState.token = null;

                            gameState.players = gameState.players.filter(
                                player => player.userId !== ws.userId
                            );

                            console.log("---------------------------------------------------------------------")
                        }
                       
                        broadcast({
                            type: "playerDisconnected"
                        });
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
            ws.on("close", async () => {

                //console.log("CLOSED PLAYER", ws.userId, new Date().toISOString());
               
                if (wss.clients.size < MAX_CONNECTIONS) {
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) { 
                            client.send(JSON.stringify({ type: "waitingForPlayer", value: true })) 
                        }
                    })
                }

                //remove from connected users
                /*delete clients[
                    user.Email.toLowerCase()
                ];*/
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
    initializeWebSocket,
    gameState
};

