let btnStartGame = document.querySelector("#btnStartGame");
let imgLoading = document.querySelector("#imgLoading");
let txtStatus = document.querySelector("#txtStatus");
let txtPlayerName = document.querySelector("#txtPlayerName");

btnStartGame.disabled = true;

//socket client
const socket = new WebSocket("ws://localhost:3000/ws");

const userNameSpan = document.querySelector("#userNameSpan");


/*intervalLoading = setInterval(() => {
    console.log("waiting for player to join.");
}, 1000);*/


//we receive
socket.onmessage = (event) => {
    //data
    const data = JSON.parse(event.data);
    //display
    console.log(`${data.type.toString()}`);

    //MAX LIMIT REACHED, we start the game
    if(data.type === "startGame"){
        //stop the loading anim
        imgLoading.style.display = "none";
        /*//clear interval
        clearInterval(intervalLoading);*/
        console.log("WE START THE GAMEEE")
        //activate the start btn
        btnStartGame.disabled = false;

        //text for the player 2
        txtPlayerName.innerText = "Player 2"
        //text for status
        txtStatus.style.display = "flex";
        //text for status
        txtStatus.innerText = "Ready"
    }

    //when 1 player exits and the other stay
    if(data.type === "waitingForPlayer"){
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
}


//movement
const keys = { 
    left: false, 
    right: false, 
    //up: false, 
    //down: false 
}; 

document.addEventListener("keydown", (e) => { 
    if (e.key === "a") keys.left = true; 
    if (e.key === "d") keys.right = true; 
    //if (e.key === "w") keys.up = true; 
    //if (e.key === "s") keys.down = true; 
}); 

document.addEventListener("keyup", (e) => { 
    if (e.key === "a") keys.left = false; 
    if (e.key === "d") keys.right = false; 
    //if (e.key === "w") keys.up = false; 
    //if (e.key === "s") keys.down = false; 
}); 

setInterval(() => { 
    if (socket.readyState === WebSocket.OPEN) { 
        socket.send(JSON.stringify({ 
            type: "input", 
            keys 
        })); 
    } 
}, 1000 / 1); // 20 veces por segundo

//close socket 
socket.onclose = () => {
    console.log("Disconnected");
}

//send message
function sendMessage(){
    try{

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


    }catch(error){
        console.log(error);
    }
}

//open socket
socket.onopen = async () => {
    console.log("Connected client ");
    sendMessage();
}