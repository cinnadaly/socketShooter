//game web socket
//SOCKET for game///////////////////////////////////////////////////////////
let playerId = null;
let gameOverSent = false;
let clientVoted = false;
let playerDisconnected = false;

let btnQuitGame = document.querySelector("#btnQuitGame");

const BASE_URL = "http://localhost:3000/api/";

//socket client
//NEW WS
const socket = new WebSocket("ws://localhost:3000/ws");

async function fetchLoggedUser() {
    try {
        ///get user
        const response = await fetch(`${BASE_URL}me`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        //console.log(data);

        return data;

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

//open socket
socket.onopen = async () => {
    console.log("Connected cliented in game ");
}

//movement
let keys = {
    left: false,//true 
    right: false, //true
};

let secondPlayerCurrentPosition = {}


//in case the user just moves to another url manually
function handleRouteChange() {
    const currentPath = window.location.pathname;
    if (previousPath === "/game" && currentPath !== "/game") {
        console.log("Saliendo de /game");
        socket.send(JSON.stringify({
            type: "leaveGame"
        }));
        socket.close();
    } else {
    }
    previousPath = currentPath;
}
window.addEventListener("popstate", handleRouteChange);


//when any player disconnects, tell the server to save the scores
btnQuitGame.addEventListener("click", (e) => {

    //animation for restart
    Swal.fire({
        title: "Quit game",
        text: "The game will be finished.",
        showCancelButton: true,
        confirmButtonText: "Return to lobby",
        cancelButtonText: "Stay in game",
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: "#1b2735",
        color: "#ffffff",
        html: `
            <div style="height: 150px">
            <p>
                The game will be finished.
            </p>
            <img width="200" src="https://img.itch.zone/aW1hZ2UvMTgzOTY2MS8xMDgxMjIwNS5naWY=/original/DCgmR1.gif" />
               
            </div>`
    }).then((result) => {
        if (result.isConfirmed) {


            alert("player disconnected")
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "playerDisconnected"
                }));
            }
        }
        if (result.isDismissed) {
            console.log("continue the game")
        }
    });

})


document.addEventListener("keydown", (e) => {
    if (e.key === "A") keys.left = true;
    if (e.key === "D") keys.right = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "A") keys.left = false;
    if (e.key === "D") keys.right = false;
});

async function startGame() {
    let playerInfo = await fetchLoggedUser();
    //SAVE PLAYER ID
    playerId = playerInfo.id;

    localStorage.setItem("playerId", playerId);

    setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "input",
                playerId,
                player: {
                    x: player.x,
                    y: player.y
                }
            }));
        }
    }, 1000 / 20);

    setInterval(() => {
        spawnEnemy();
    }, 2000)
}

//we receive
socket.onmessage = async (event) => {
    //data
    const response = JSON.parse(event.data);
    let playerId = localStorage.getItem("playerId")
    const data = response;

    if (data.type === "input") {
        if (playerId != data.values.playerId) {
            //send the position values
            secondPlayer.x = data.values.player.x;
            secondPlayer.y = data.values.player.y;
        }
    }


    //game over (from server)
    if (data.type === "gameOver") {
        //gameOver = true;
        console.log(data.score);
        showGameOver(data.score).call(updateScene);
    }

    if (data.type === "restartGame") {
        restart();
    }

    //player leaves
    if (data.type === "playerDisconnected") {
        showPlayerDisconnected();
    }

    //when server creates new enemy
    if (data.type === "spawnEnemy") {
        const enemy = createScene.add.image(
            data.newEnemy.x,
            data.newEnemy.y,
            "enemy"
        );

        enemy.setDisplaySize(50, 50);

        enemies.push(enemy);
    }

    //when enemy explodes, all clients hear
    if (data.type === "enemyHit") {
        explosionSound.play();
    }


    //we receive broadcast for new bullet
    if (data.type === "bullet") {
        const bullet = updateScene.add.rectangle(
            data.bullet.x,
            data.bullet.y,
            5,
            15,
            0xffff00
        );

        //bullet must have owner
        bullet.owner = data.playerId;
        //all clients hear the bullet
        shootSound.play();

        bullets.push(bullet);
    }
}

//GAME functions/////////////////////////////////////////////////////////////////////

const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 700,
    backgroundColor: "#000000",
    scene: {
        preload,
        create,
        update
    },
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

//sounds and fx
function preload() {
    this.load.audio("shootSound", "assets/shoot.wav");
    this.load.audio("explosionSound", "assets/explosion.wav");
    this.load.image("player", "assets/player.PNG");
    this.load.image("secondPlayer", "assets/secondPlayer.PNG");
    this.load.image("enemy", "assets/enemy2.PNG");
}

new Phaser.Game(config);

let player;
let secondPlayer;

let cursors;
let shootKey;
let enterKey;
let leftKey;
let rightKey;

let bullets = [];
let enemies = [];

let score = 0;
let scoreText;

let gameOver = false;
let gameOverText;
let restartText;

let updateScene; // context
let createScene;

let shootSound;
let explosionSound;


function create() {

    createScene = this;

    shootSound = this.sound.add("shootSound");
    explosionSound = this.sound.add("explosionSound");

    player = this.add.image(
        250,
        620,
        "player"
    );
    player.setDisplaySize(50, 50);

    secondPlayer = this.add.image(
        250,
        620,
        "secondPlayer"
    );
    secondPlayer.setDisplaySize(50, 50);

    spawnEnemy();//create the first enemy

    cursors = this.input.keyboard.createCursorKeys();

    shootKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    leftKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.A
    );

    rightKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.D
    );

    enterKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    scoreText = this.add.text(10, 10, "Score: 0 A,D",
        {
            fontSize: "30px",
            color: "#ffffff"
        }
    );
}

//PLAYER MOVEMENTS, EACH PLAYER MOVES THEMSELVES
function moveToRight() {
    if (rightKey.isDown && player.x < 475) {
        player.x += 3;
    }
}

function moveToLeft() {
    if (leftKey.isDown && player.x > 25) {
        player.x -= 3;
    }
}

function secondPlayerMovement(movement) {
    if (movement.left == true && secondPlayer.x > 25) {
        secondPlayer.x -= 3;
    } else if (movement.right == true && secondPlayer.x < 475) {
        secondPlayer.x += 3;
    }
}

function update() {
    updateScene = this; //new context
    moveToLeft();
    moveToRight();

    if (gameOver) {
        if (clientVoted == true) {
            console.log("client voted from view");
            socket.send(JSON.stringify({
                type: "restartGame"
            }));
            clientVoted = false;
        }
        return;
    }



    if (Phaser.Input.Keyboard.JustDown(shootKey)) {
        shoot();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {

        bullets[i].y -= 15;

        if (bullets[i].y < 0) {

            bullets[i].destroy();

            bullets.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += 4;

        if (enemies[i].y > 750) {
            enemies[i].destroy();
            enemies.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {

            const bullet = bullets[j];

            if (isColliding(enemies[i], bullets[j])) {
                console.log("ENEMY HITTTTT")

                const owner = bullet.owner;

                enemies[i].destroy();
                bullets[j].destroy();

                enemies.splice(i, 1);
                bullets.splice(j, 1);

                if (owner == playerId) {
                    score++;
                    scoreText.setText("Score: " + score + " A,D");
                }
                //for enemy explosion sound as broadcast
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: "enemyHit",
                        playerId: bullet.owner,
                        score
                    }));
                }
                break;
            }
        }
    }

    //current player collides with enemy
    for (const enemy of enemies) {
        if (isColliding(player, enemy) || isColliding(secondPlayer, enemy)) {
            if (socket.readyState === WebSocket.OPEN) {
                if (!gameOverSent) {

                    gameOverSent = true;
                    console.log("ENVIANDO GAME OVER", playerId, score);

                    socket.send(JSON.stringify({
                        type: "gameOver",
                        playerId,
                        score
                    }));
                }
                break;
            }
        }

    }
}

//RANDOM
function spawnEnemy() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "spawnEnemy"
        }));
    }
}

//PLAYER SHOOTS
function shoot() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "bullet",
            playerId,
            bullet: {
                x: player.x,
                y: player.y - 30
            }
        }));
    }
}

function isColliding(a, b) {

    return (
        a.getBounds().x <
        b.getBounds().x +
        b.getBounds().width &&

        a.getBounds().x +
        a.getBounds().width >
        b.getBounds().x &&

        a.getBounds().y <
        b.getBounds().y +
        b.getBounds().height &&

        a.getBounds().y +
        a.getBounds().height >
        b.getBounds().y
    );
}

function showGameOver(score) {
    if (gameOver) {
        return;
    }

    gameOver = true;

    //animation for votes after game over
    Swal.fire({
        title: "Game Over",
        text: "Vote for restart?",
        icon: undefined,
        confirmButtonText: "Retry",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        background: "#1b2735",
        color: "#ffffff",
        confirmButtonColor: "#1e90ff",
        html: `
            <div style="height: 200px">
                <img width="350" src="../assets/explosion.PNG" />

                <p>
                    Score: ${score}
                </p>

                <!--<img height="150" src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/aebb45ff-108b-48c9-b5ff-7cfcacf68232/df10yp9-09aefc5b-31b0-40c9-8ae2-0f9818499813.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9hZWJiNDVmZi0xMDhiLTQ4YzktYjVmZi03Y2ZjYWNmNjgyMzIvZGYxMHlwOS0wOWFlZmM1Yi0zMWIwLTQwYzktOGFlMi0wZjk4MTg0OTk4MTMuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.ED0-b6_K4EqrYuk-lkfcafU_x3l5CHsz73ouzVbWssU" />-->
            </div>`
    }).then((data) => { clientVoted = true; });
}

function restart() {

    gameOver = false;
    gameOverSent = false;
    score = 0;
    gameOver = false;

    scoreText.setText("Score: 0 A,D");

    for (const bullet of bullets) {
        bullet.destroy();
    }

    for (const enemy of enemies) {
        enemy.destroy();
    }

    bullets = [];
    enemies = [];

    player.x = 250;
    player.y = 620;

    secondPlayer.x = 250;
    secondPlayer.y = 620;

    spawnEnemy();
}


function showPlayerDisconnected() {
    /*if (playerDisconnected)
        return;*/

    playerDisconnected = true;
    gameOver = true;

    //no enemies nor bullets
    for (const enemy of enemies) {
        enemy.destroy();
    }
    enemies = [];

    for (const bullet of bullets) {
        bullet.destroy();
    }
    bullets = [];

    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    //go back to lobby
    window.location.href = "/lobby";
    //});
}

startGame();