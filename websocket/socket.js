const WebSocket = require("ws");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { sql } = require("../config/db");
//connected users
const clients = {};

const initializeWebSocket = (server) => {
    //create websocket server
    const wss = new WebSocket.Server({
        server, //attach to express server
        path: "/ws"//route
    });
    //when user connects
    wss.on("connection", async (ws, req) => {
        try {
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
            const result = await sql.query`
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
            clients[user.Email.toLowerCase()] = ws;

            console.log(`${user.Email} connected`);

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

