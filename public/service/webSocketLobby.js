let btnStartGame = document.querySelector("#btnStartGame");
let imgLoading = document.querySelector("#imgLoading");
let txtStatus = document.querySelector("#txtStatus");
let txtPlayerName = document.querySelector("#txtPlayerName");


const BASE_URL = "http://localhost:3000/api/";

btnStartGame.disabled = true;

//socket client
const socket = new WebSocket("ws://localhost:3000/ws");

const userNameSpan = document.querySelector("#userNameSpan");

/*intervalLoading = setInterval(() => {
    console.log("waiting for player to join.");
}, 1000);*/


async function getUserLogged() {
    const response = await fetch(`${BASE_URL}me`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const data = await response.json();
    console.log(data);

    return data;
}

//SEND GAME STARTED TO SERVER
btnStartGame.addEventListener("click", () => {
    //trigger to server
    gameStarted();
})


//we receive
socket.onmessage = async (event) => {
    //data
    const data = JSON.parse(event.data);
    /*//display
    console.log(`${data.type.toString()}`);*/


    //MAX LIMIT REACHED, we start the game
    if (data.type === "lobbyReady") {
        //stop the loading anim
        imgLoading.style.display = "none";
        /*//clear interval
        clearInterval(intervalLoading);*/
        console.log("WE START THE GAME")
        //activate the start btn
        btnStartGame.disabled = false;

        //text for the player 2
        txtPlayerName.innerText = "Player 2"
        //text for status
        txtStatus.style.display = "flex";
        //text for status of GAME
        txtStatus.innerText = "Ready"
    }

    //when 1 player exits and the other stay
    if (data.type === "waitingForPlayer") {
        //activate the loading anim
        imgLoading.style.display = "flex";
        //set interval
        /*clearInterval(intervalLoading);*/
        console.log("WAITING FOR PLAYER")
        //activate the start btn
        btnStartGame.disabled = true;
        //text for the player 2
        txtPlayerName.innerText = "Waiting for player"
        //text for status
        txtStatus.style.display = "none";
    }

    //when 1 player started game, server broadcast this to all active clients
    if (data.type === "gameStarted") {
        user = await getUserLogged();
        console.log("user from gameStarted client ", user)

        sessionStorage.setItem("userId", user.id);

        //both go at the same time to game screen
        window.location.href = "/game";
    }

    //player movement in real time

}



//close socket 
socket.onclose = () => {
    console.log("Disconnected");
}

//when 1 player starts game, hit this
function gameStarted() {
    try {
        socket.send(JSON.stringify({
            type: "gameStarted",
            value: true
        }))

    } catch (err) {
        console.error(err);
    }
}

//send message
function sendMessage() {
    try {

        const currentUserName = userNameSpan.dataset.username;
        console.log(currentUserName);

        socket.send(JSON.stringify({
            type: "message",
            from: `${currentUserName}`,
            to: `${currentUserName}2`,
            text: "Player connected"
        }))


        //custom trigger
        socket.send(JSON.stringify({
            type: "newPlayer",
        }));


    } catch (error) {
        console.log(error);
    }
}

//open socket
socket.onopen = async () => {
    console.log("Connected client ");
    sendMessage();
}