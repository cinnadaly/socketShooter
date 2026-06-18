//NOTA, SE MANDA DUPLICADO EL INSERT A DB DE LOS SCORES, MUST FIX

//SOCKET for game///////////////////////////////////////////////////////////
let playerId = null;
let gameOverSent = false;

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
    //up: false, 
    //down: false 
};

let secondPlayerCurrentPosition = {}


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

    //send list of first enemies

    //INTERVAL
    //CHANGE SENDING KEYS
    /*setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "input",
                playerId,
                keys
            }));
        }
    }, 1000 / 20); // 20 times per second */

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

    //console.log(data)

    //CHANGE TO TEST CURRENT POSITION
    //response from server to input from client
    /* if (data.type === "input") {
        //movement
        if (playerId !== data.values.playerId) {
            secondPlayerCurrentPosition = data.values.keys;
            //secondPlayerMovement(data.values.keys);
        }
        //here you are going to update the other player, NOT YOURSELF
        //your own movement is being executed by game.js  */

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
        showGameOver.call(updateScene);
    }

    //when server creates new enemy
    if (data.type === "spawnEnemy") {
        const enemy = createScene.add.rectangle(
            data.newEnemy.x,
            data.newEnemy.y,
            50,
            50,
            0xff0000
        );

        enemies.push(enemy);
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
        create,
        update
    },
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

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


function create() {

    createScene = this;

    player = this.add.rectangle(
        250,
        620,
        50,
        50,
        0x00ff00
    );

    secondPlayer = this.add.rectangle(
        250,
        620,
        50,
        50,
        0x5555ff
    );

    spawnEnemy();//create the first enemy

    /*for (let i = 0; i < 5; i++) {
        spawnEnemy.call(this);
    }*/

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
        //if (player.x < 475) {
        player.x += 3;
    }
}

function moveToLeft() {
    if (leftKey.isDown && player.x > 25) {
        //if (player.x > 25) {
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

    //TEST
    //secondPlayerMovement(secondPlayerCurrentPosition);
    moveToLeft();
    moveToRight();


    if (gameOver) {
        if (Phaser.Input.Keyboard.JustDown(enterKey)) {
            restart.call(this);
        }
        return;
    }



    if (Phaser.Input.Keyboard.JustDown(shootKey)) {
        /*const bullet =
            this.add.rectangle(
                player.x,
                player.y - 30,
                5,
                15,
                0xffff00
            );
 
        bullets.push(bullet);*/
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
            //spawnEnemy.call(this);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {

            if (isColliding(enemies[i], bullets[j])) {
                enemies[i].destroy();
                bullets[j].destroy();

                enemies.splice(i, 1);
                bullets.splice(j, 1);

                //spawnEnemy.call(this);
                score++;

                scoreText.setText("Score: " + score + " A,D");

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

                showGameOver.call(this);

                //TEST BREAK KAROL
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
            bullet: {
                x: player.x,
                y: player.y - 30
            }
        }));
    }
}

/*
function spawnEnemy() {
    const enemy =
        this.add.rectangle(
            Phaser.Math.Between(
                25,
                475
            ),
            Phaser.Math.Between(
                -500,
                -50
            ),
            50,
            50,
            0xff0000
        );
 
    enemies.push(enemy);
}*/

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

function showGameOver() {

    if (gameOver) {
        return;
    }

    gameOver = true;

    gameOverText =
        this.add.text(
            70,
            300,
            "THE ENEMIES WON",
            {
                fontSize: "36px",
                color: "#ffffff"
            }
        );

    restartText =
        this.add.text(
            70,
            360,
            "Press ENTER to restart",
            {
                fontSize: "28px",
                color: "#ffffff"
            }
        );
}

function restart() {

    gameOver = false;
    gameOverSent = false;


    score = 0;

    gameOver = false;

    scoreText.setText(
        "Score: 0 A,D"
    );

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

    /*for (let i = 0; i < 5; i++) {
        spawnEnemy.call(this);
    }*/

    gameOverText.destroy();
    restartText.destroy();
}



startGame();