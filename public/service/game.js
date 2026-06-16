const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 700,
    backgroundColor: "#000000",
    scene: {
        create,
        update
    }
};

new Phaser.Game(config);

let player;

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

function create() {

    player = this.add.rectangle(
        250,
        620,
        50,
        50,
        0x00ff008

    );

    for (let i = 0; i < 5; i++) {
        spawnEnemy.call(this);
    }

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

    scoreText = this.add.text(
        10,
        10,
        "Score: 0",
        {
            fontSize: "30px",
            color: "#ffffff"
        }
    );
}

//main 
function update() {

    //check if game over?
    if (gameOver) {
        return;
    }

    if (leftKey.isDown && player.x > 25) {
        player.x -= 6;
    }

    if (rightKey.isDown && player.x < 475) {
        player.x += 6;
    }

    if (Phaser.Input.Keyboard.JustDown(shootKey)) {

        const bullet = this.add.rectangle(player.x, player.y - 30, 5, 15, 0xffff00);

        bullets.push(bullet);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {

        bullets[i].y -= 50;

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

            spawnEnemy.call(this);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {

        for (let j = bullets.length - 1; j >= 0; j--) {

            if (isColliding(enemies[i], bullets[j])) {

                enemies[i].destroy();
                bullets[j].destroy();

                enemies.splice(i, 1);
                bullets.splice(j, 1);

                spawnEnemy.call(this);

                score++;

                scoreText.setText(
                    "Score: " + score
                );

                break;
            }
        }
    }

    // test to stop game over loop :)
    /*for (enemy of enemies) {

        if (isColliding(player, enemy)) {
            alert("Game Over");
        }
    }*/
    for (const enemy of enemies) {
        if (!gameOver && isColliding(player, enemy)) {

            gameOver = true;

            alert("Game Over");

            return;
        }
    }
}

function spawnEnemy() {
    const enemy = this.add.rectangle(Phaser.Math.Between(25, 475), Phaser.Math.Between(-500, -50), 50, 50, 0xff0000);
    enemies.push(enemy);
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