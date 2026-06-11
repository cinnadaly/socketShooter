const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 700,
    backgroundColor: "#000000",
    scene: {
        create: create,
        update: update
    }
};

new Phaser.Game(config);


let jugador;

let cursores;
let espacio;
let enter;

let score = 0;
let scoreText;

let gameOver = false;
let gameOverText;
let restartText;

function create() {

    jugador = this.add.rectangle(
        250,
        620,
        50,
        50,
        0x00ff00
    );


    cursores = this.input.keyboard.createCursorKeys();

    espacio = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    enter = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    right = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.D
    );

    left = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.A
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

function update() {

    if (gameOver) {

        if (
            Phaser.Input.Keyboard.JustDown(
                enter
            )
        ) {
            reiniciar.call(this);
        }

        return;
    }
    if (left.isDown && jugador.x > 25) {
        jugador.x -= 6;
    }

    if (right.isDown && jugador.x < 475) {
        jugador.x += 6;
    }

    if (Phaser.Input.Keyboard.JustDown(enter)) {
        console.log("dispara")
    }
}


function colision(a, b) {

    const aBox = a.getBounds();
    const bBox = b.getBounds();
    return (
        aBox.x < bBox.x + bBox.width &&
        aBox.x + aBox.width > bBox.x &&
        aBox.y < bBox.y + bBox.height &&
        aBox.y + aBox.height > bBox.y
    );
}

function mostrarGameOver() {

    if (gameOver) {
        return;
    }

    gameOver = true;

    gameOverText =
        this.add.text(
            70,
            300,
            "LAS NAVES GANARON",
            {
                fontSize: "36px",
                color: "#ffffff"
            }
        );

    restartText =
        this.add.text(
            70,
            360,
            "ENTER para reiniciar",
            {
                fontSize: "28px",
                color: "#ffffff"
            }
        );
}

function reiniciar() {

    score = 0;

    gameOver = false;

    scoreText.setText(
        "Score: 0"
    );

    jugador.x = 250;
    jugador.y = 620;

    gameOverText.destroy();
    restartText.destroy();
}