const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
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
           
    //when user connects
    wss.on("connection", async (ws, req) => {
        console.log("socket io server started")
        console.log(wss)
        //wss.clients.forEach((client) => console.log(client.Email))
        try {
            // Check if the limit is exceeded
            if (wss.clients.size > MAX_CONNECTIONS) {
                ws.close(1013, "Service temporarily overloaded, max connections reached.");
                return;
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

            ws.userId = user.Id;
            ws.email = user.Email;
            ws.name = user.Username;

            const connectedUsers = Array.from(wss.clients)
                console.log("All USERS")
            connectedUsers.forEach((user) => {
                console.log(`ID: ${user.userId} Name ${user.name}`  )
            })

            wss.clients.forEach((client) => {
                console.log({
                    id: client.userId,
                    name: client.name,
                    email: client.email
                })
            })

            console.log(`${user.Email} connected`);
            console.log(`${user.Id} is the ID`);

            //receive messages (listen)
            ws.on("message", (message) => {
                try {
                    const data = JSON.parse(message);

                    console.log(
                        "MESSAGE:",
                        data
                    );

                    //find destination user
                    const target =
                        clients[
                        data.to
                            .trim()
                            .toLowerCase()
                        ];

                    //if target exists and socket open (connected)
                    if (target && target.readyState === WebSocket.OPEN) {
                        //send message to receiver
                        target.send(JSON.stringify({
                            type: "message",
                            from: data.from,
                            fromName: data.fromName,
                            text: data.text
                        }));

                    } else {
                        //user offline
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "User not connected"
                        }));
                    }

                } catch (error) {
                    console.log(error);
                }
            });

            //when user disconnects
            ws.on("close", () => {
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

