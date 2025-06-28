let musicStarted = false;
let idleTextures = [], runTextures = [], cat, ground;
let app, gameContainer;
const gravity = 0.4;
const jumpPower = -8;
let keys = {};
let jumpCount = 0;
let maxJumps = 2;
let obstacles = [];
let nextObstacleTime = 0;
let obstacleWave = [];
let score = 0;
let gameOver = false;
const initialGroundSpeed = 4;
let groundSpeed = initialGroundSpeed;
let scoreText;
let bgMusic = document.getElementById("bg-music");
let purr = document.getElementById("purr-sound");
let particleContainer;
let particles = [];
let backgroundSprite;
let backgroundTextures = [];
let cloudTextures = [];
let cloudsLayer1 = [], cloudsLayer2 = [];

const obstacleImages = [
    { src: "assets/Cat_Run/Tree_1.png", width: 66, height: 66 },
    { src: "assets/Cat_Run/Food_2.png", width: 40, height: 65 },
    { src: "assets/Cat_Run/Food_3.png", width: 32, height: 32 }
];

let loadedObstacleTextures = [];
obstacleImages.forEach(({ src, width, height }) => {
    loadedObstacleTextures.push({ width, height, texture: PIXI.Texture.from(src) });
});

function setupIdleCat() {
    const base = PIXI.BaseTexture.from("assets/Cat_Run/Idle.png");
    idleTextures = Array.from({ length: 6 }, (_, i) =>
        new PIXI.Texture(base, new PIXI.Rectangle(i * 64, 0, 64, 64))
    );

    if (app) app.destroy(true, { children: true });

    app = new PIXI.Application({ width: 128, height: 128, backgroundAlpha: 0, antialias: true });
    const container = document.getElementById("idle-cat-container");
    container.innerHTML = "";
    container.style.width = "128px";
    container.style.height = "128px";
    container.appendChild(app.view);

    const idleSprite = new PIXI.AnimatedSprite(idleTextures);
    Object.assign(idleSprite, {
        animationSpeed: 0.1,
        scale: new PIXI.Point(2, 2),
        x: 0,
        y: 0
    });
    idleSprite.play();
    app.stage.addChild(idleSprite);
}

function resetGameState() {
    runTextures = [];
    idleTextures = [];
    obstacles = [];
    obstacleWave = [];
    particles = [];
    cloudTextures = [];
    cloudsLayer1 = [];
    cloudsLayer2 = [];
    keys = {};
    nextObstacleTime = 0;
    score = 0;
    gameOver = false;
    jumpCount = 0;
    groundSpeed = initialGroundSpeed;
}

function startGame() {
    resetGameState();

    if (app) {
        app.ticker.stop();
        app.destroy(true, { children: true });
    }

    document.querySelector(".start-screen").style.display = "none";
    document.getElementById("idle-cat-container").innerHTML = "";

    app = new PIXI.Application({ width: 860, height: 380, backgroundColor: 0xcceeff });
    Object.assign(app.view.style, {
        display: "block",
        margin: "0 auto",
        borderRadius: "12px"
    });
    document.querySelector(".game-window").appendChild(app.view);

    gameContainer = new PIXI.Container();
    particleContainer = new PIXI.Container();
    app.stage.addChild(gameContainer, particleContainer);

    backgroundTextures = [
        PIXI.Texture.from("assets/Backgrounds/Summer2.png"),
        PIXI.Texture.from("assets/Backgrounds/Summer5.png"),
        PIXI.Texture.from("assets/Backgrounds/Summer7.png")
    ];
    backgroundSprite = new PIXI.Sprite(backgroundTextures[0]);
    Object.assign(backgroundSprite, { width: 860, height: 380 });
    gameContainer.addChild(backgroundSprite);

    cloudTextures = Array.from({ length: 10 }, (_, i) => PIXI.Texture.from(`assets/Clouds/Cloud${i + 1}.png`));
    [cloudsLayer1, cloudsLayer2] = [[], []];

    for (let i = 0; i < 2; i++) {
        const cloud = new PIXI.Sprite(cloudTextures[i]);
        Object.assign(cloud, {
            x: Math.random() * 860,
            y: Math.random() * 40,
            alpha: 0.6,
            speed: 0.2
        });
        gameContainer.addChild(cloud);
        cloudsLayer1.push(cloud);
    }

    const cloud = new PIXI.Sprite(cloudTextures[5]);
    Object.assign(cloud, {
        x: Math.random() * 860,
        y: 10 + Math.random() * 50,
        alpha: 0.4,
        speed: 0.1
    });
    gameContainer.addChild(cloud);
    cloudsLayer2.push(cloud);

    const runSheet = PIXI.BaseTexture.from("assets/Cat_Run/Run_1.png");
    runTextures = Array.from({ length: 6 }, (_, i) =>
        new PIXI.Texture(runSheet, new PIXI.Rectangle(i * 64, 0, 64, 64))
    );

    cat = new PIXI.AnimatedSprite(runTextures);
    Object.assign(cat, {
        x: 50,
        y: 270,
        width: 64,
        height: 64,
        vy: 0,
        animationSpeed: 0.15
    });
    cat.play();
    gameContainer.addChild(cat);

    ground = new PIXI.Graphics();
    ground.beginFill(0x996633).drawRect(0, 330, 860, 50).endFill();
    gameContainer.addChild(ground);

    scoreText = new PIXI.Text("Score: 0", {
        fontSize: 24,
        fill: "#ff3399",
        fontWeight: "bold"
    });
    scoreText.position.set(10, 10);
    gameContainer.addChild(scoreText);

    window.addEventListener("keydown", e => keys[e.code] = true);
    window.addEventListener("keyup", e => keys[e.code] = false);

    app.ticker.add(gameLoop);
}

function gameLoop() {
    if (gameOver) return;

    if (keys["Space"] && jumpCount < maxJumps) {
        cat.vy = jumpPower;
        jumpCount++;
        keys["Space"] = false;
    }

    cat.vy += gravity;
    cat.y += cat.vy;

    if (cat.y >= 270) {
        cat.y = 270;
        cat.vy = 0;
        jumpCount = 0;
    }

    const speedSteps = [5, 6, 7, 8, 9, 10, 11, 12];
    groundSpeed = speedSteps[Math.min(Math.floor(score / 100), speedSteps.length - 1)];

    [...cloudsLayer1, ...cloudsLayer2].forEach(cloud => {
        cloud.x -= groundSpeed * (cloud.alpha > 0.5 ? 0.3 : 0.15);
        if (cloud.x + cloud.width < 0) {
            cloud.x = 860 + Math.random() * 100;
            cloud.y = cloud.alpha > 0.5 ? Math.random() * 120 : Math.random() * 180 + 50;
        }
    });

    backgroundSprite.texture = score < 500 ? backgroundTextures[0]
        : score < 1000 ? backgroundTextures[1]
            : backgroundTextures[2];

    const now = app.ticker.lastTime;
    if (obstacleWave.length > 0 && now >= obstacleWave[0].time) {
        spawnObstacle(obstacleWave.shift().type);
    }
    if (obstacleWave.length === 0 && now >= nextObstacleTime) {
        generateObstacleWave();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= groundSpeed;
        if (obs.x + obs.width < 0) {
            gameContainer.removeChild(obs);
            obstacles.splice(i, 1);
            continue;
        }
        if (checkCollision(cat, obs)) return endGame();
    }

    score += 0.06;
    scoreText.text = "Score: " + Math.floor(score);

    createDust();
    updateDust();
}

function createDust() {
    const dust = new PIXI.Graphics();
    dust.beginFill(0xffffff, 0.4).drawCircle(0, 0, 2 + Math.random() * 2).endFill();
    Object.assign(dust, {
        x: cat.x + 20,
        y: cat.y + 50,
        vx: -groundSpeed - Math.random() * 2,
        alphaSpeed: 0.01 + Math.random() * 0.01
    });
    particles.push(dust);
    particleContainer.addChild(dust);
}

function updateDust() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.alpha -= p.alphaSpeed;
        if (p.alpha <= 0) {
            particleContainer.removeChild(p);
            particles.splice(i, 1);
        }
    }
}

function generateObstacleWave() {
    const baseTime = app.ticker.lastTime;
    const waveLength = Math.random() < 0.7 ? 1 : 2;
    let currentDelay = 0;
    for (let i = 0; i < waveLength; i++) {
        const spacing = Math.floor(Math.random() * 40) + 80;
        obstacleWave.push({ time: baseTime + currentDelay, type: getRandomObstacleIndex() });
        currentDelay += spacing;
    }
    nextObstacleTime = baseTime + 1500 + Math.random() * 1000;
}

function getRandomObstacleIndex() {
    return Math.floor(Math.random() * loadedObstacleTextures.length);
}

function spawnObstacle(index) {
    const ob = loadedObstacleTextures[index];
    const sprite = new PIXI.Sprite(ob.texture);
    Object.assign(sprite, {
        x: 860,
        y: 330 - ob.height,
        width: ob.width,
        height: ob.height
    });
    gameContainer.addChild(sprite);
    obstacles.push(sprite);
}

function checkCollision(cat, obs) {
    const c = cat.getBounds(), o = obs.getBounds();
    return c.x + 10 < o.x + o.width - 5 &&
        c.x + c.width - 10 > o.x + 5 &&
        c.y + 5 < o.y + o.height &&
        c.y + c.height - 5 > o.y;
}

function endGame() {
    gameOver = true;
    app.ticker.stop();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    document.getElementById("final-score").textContent = Math.floor(score);
    document.getElementById("game-over-screen").style.display = "block";
}

document.getElementById("play-btn").addEventListener("click", () => {
    if (!musicStarted) {
        bgMusic.play().catch(() => {});
        musicStarted = true;
    }
    startGame();
});

document.getElementById("restart-btn").addEventListener("click", () => location.reload());
document.getElementById("back-btn").addEventListener("click", () => window.location.href = "index.html");
document.getElementById("back-btn-end").addEventListener("click", () => window.location.href = "index.html");

document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("mouseenter", () => {
        purr.currentTime = 0;
        purr.play();
    });
});

window.addEventListener("DOMContentLoaded", setupIdleCat);
