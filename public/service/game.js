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

let balas = [];
let enemigos = [];

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

    for(let i = 0; i < 5; i++) {
        crearEnemigo.call(this);
    }

    cursores = this.input.keyboard.createCursorKeys();

    espacio = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    enter = this.input.keyboard.addKey(
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

function update() {

    if(gameOver) {

        if(
            Phaser.Input.Keyboard.JustDown(
                enter
            )
        ) {
            reiniciar.call(this);
        }

        return;
    }

    if(cursores.left.isDown && jugador.x > 25) {
        jugador.x -= 6;
    }

    if(cursores.right.isDown && jugador.x < 475) {
        jugador.x += 6;
    }

    if(
        Phaser.Input.Keyboard.JustDown(
            espacio
        )
    ) {

        const bala =
            this.add.rectangle(
                jugador.x,
                jugador.y - 30,
                5,
                15,
                0xffff00
            );

        balas.push(bala);
    }

    for(let i = balas.length - 1; i >= 0; i--) {

        balas[i].y -= 15;

        if(balas[i].y < 0) {

            balas[i].destroy();

            balas.splice(i, 1);
        }
    }

    for(let i = enemigos.length - 1; i >= 0; i--) {

        enemigos[i].y += 4;

        if(enemigos[i].y > 750) {

            enemigos[i].destroy();

            enemigos.splice(i, 1);

            crearEnemigo.call(this);
        }
    }

    for(let i = enemigos.length - 1; i >= 0; i--) {

        for(let j = balas.length - 1; j >= 0; j--) {

            if(colision(
                enemigos[i],
                balas[j]
            )) {

                enemigos[i].destroy();
                balas[j].destroy();

                enemigos.splice(i, 1);
                balas.splice(j, 1);

                crearEnemigo.call(this);

                score++;

                scoreText.setText(
                    "Score: " + score
                );

                break;
            }
        }
    }

    for(const enemigo of enemigos) {

        if(
            colision(
                jugador,
                enemigo
            )
        ) {

            mostrarGameOver.call(this);
        }
    }
}

function crearEnemigo() {

    const enemigo =
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

    enemigos.push(
        enemigo
    );
}

function colision(a, b) {

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

function mostrarGameOver() {

    if(gameOver) {
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

    for(const bala of balas) {
        bala.destroy();
    }

    for(const enemigo of enemigos) {
        enemigo.destroy();
    }

    balas = [];
    enemigos = [];

    jugador.x = 250;
    jugador.y = 620;

    for(let i = 0; i < 5; i++) {
        crearEnemigo.call(this);
    }

    gameOverText.destroy();
    restartText.destroy();
}