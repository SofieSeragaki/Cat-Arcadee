import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.2.4/dist/pixi.mjs';

const container = document.getElementById('falling-cats-container');

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundAlpha: 0,
    resizeTo: window
});
container.appendChild(app.view);

const catImages = [
    'assets/Cat_Run/Jump_5.png',
    'assets/Cat_Run/Cat_2.png',
    'assets/Cat_Run/Cat_3.png'
];

function createFallingCat() {
    const texture = PIXI.Texture.from(catImages[Math.floor(Math.random() * catImages.length)]);
    const cat = new PIXI.Sprite(texture);

    cat.x = Math.random() * app.screen.width;
    cat.y = -Math.random() * 200;
    cat.anchor.set(0.5);
    cat.scale.set(0.6 + Math.random() * 0.8);
    cat.rotationSpeed = (Math.random() - 0.5) * 0.02;
    cat.fallSpeed = 1 + Math.random() * 2;

    app.stage.addChild(cat);

    cat.update = () => {
        cat.y += cat.fallSpeed;
        cat.rotation += cat.rotationSpeed;
        if (cat.y > app.screen.height + 50) {
            app.stage.removeChild(cat);
        }
    };

    fallingCats.push(cat);
}

const fallingCats = [];
setInterval(createFallingCat, 500);

app.ticker.add(() => {
    fallingCats.forEach(cat => cat.update());
});

const music = document.getElementById('bg-music');
const purr = document.getElementById('purr-sound');
let musicStarted = false;

document.addEventListener('click', () => {
    if (!musicStarted) {
        music.play().catch(e => console.log("Auto-play blocked"));
        musicStarted = true;
    }
});

document.querySelectorAll('.cat-btn').forEach(button => {
    button.addEventListener('mouseenter', () => {
        purr.currentTime = 0;
        purr.play();
    });
});

window.startGame = function(page) {
    window.location.href = page;
};
