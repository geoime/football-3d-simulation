import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// ==================== GAME CONFIG ====================
const CONFIG = {
    PITCH_WIDTH: 100,
    PITCH_HEIGHT: 68,
    HALF_TIME: 180, // 3 minutes in seconds
    STADIUM_SIZE: 150,
    PLAYER_HEIGHT: 1.8,
    NUM_PLAYERS_TEAM: 11,
};

// ==================== GAME STATE ====================
let gameState = {
    homeScore: 0,
    awayScore: 0,
    timeLeft: CONFIG.HALF_TIME,
    isFirstHalf: true,
    isPaused: false,
    ballPos: new THREE.Vector3(0, 0.5, 0),
    ballVel: new THREE.Vector3(0, 0, 0),
};

// ==================== SCENE SETUP ====================
const canvas = document.querySelector('#canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'highp' });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
canvas.appendChild(renderer.domElement);

// ==================== CAMERA SETUP ====================
camera.position.set(0, 35, 60);
camera.lookAt(0, 0, 0);

// ==================== LIGHTING ====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -150;
directionalLight.shadow.camera.right = 150;
directionalLight.shadow.camera.top = 150;
directionalLight.shadow.camera.bottom = -150;
scene.add(directionalLight);

// ==================== STADIUM ====================
function createStadium() {
    const stadiumGroup = new THREE.Group();

    // Grass pitch
    const grassGeometry = new THREE.PlaneGeometry(CONFIG.PITCH_WIDTH + 20, CONFIG.PITCH_HEIGHT + 20);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x1a8a1a });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    stadiumGroup.add(grass);

    // Pitch lines
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const points = [];

    const w = CONFIG.PITCH_WIDTH / 2;
    const h = CONFIG.PITCH_HEIGHT / 2;

    // Pitch boundary
    points.push(new THREE.Vector3(-w, 0.01, -h));
    points.push(new THREE.Vector3(w, 0.01, -h));
    points.push(new THREE.Vector3(w, 0.01, h));
    points.push(new THREE.Vector3(-w, 0.01, h));
    points.push(new THREE.Vector3(-w, 0.01, -h));

    // Center line
    points.push(new THREE.Vector3(0, 0.01, -h));
    points.push(new THREE.Vector3(0, 0.01, h));

    // Center circle
    for (let i = 0; i <= 360; i += 10) {
        const angle = (i * Math.PI) / 180;
        points.push(new THREE.Vector3(Math.cos(angle) * 9, 0.01, Math.sin(angle) * 9));
    }

    lineGeometry.setFromPoints(points);
    const pitchLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    stadiumGroup.add(pitchLines);

    // Goal areas
    const goalAreaGeometry = new THREE.BufferGeometry();
    const goalAreaPoints = [];
    const goalW = w;
    const goalD = 16.5;

    // Home goal area
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, -goalD));
    goalAreaPoints.push(new THREE.Vector3(goalW, 0.01, -goalD));
    goalAreaPoints.push(new THREE.Vector3(goalW, 0.01, 0));
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, 0));
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, -goalD));

    // Away goal area
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, goalD));
    goalAreaPoints.push(new THREE.Vector3(goalW, 0.01, goalD));
    goalAreaPoints.push(new THREE.Vector3(goalW, 0.01, 0));
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, 0));
    goalAreaPoints.push(new THREE.Vector3(-goalW, 0.01, goalD));

    goalAreaGeometry.setFromPoints(goalAreaPoints);
    const goalAreas = new THREE.LineSegments(goalAreaGeometry, lineMaterial);
    stadiumGroup.add(goalAreas);

    // Stadium stands (simple)
    const standMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const standHeight = 25;
    const standDepth = 15;

    const frontStandGeometry = new THREE.BoxGeometry(CONFIG.PITCH_WIDTH + 20, standHeight, standDepth);
    const frontStand = new THREE.Mesh(frontStandGeometry, standMaterial);
    frontStand.position.set(0, standHeight / 2, -CONFIG.PITCH_HEIGHT / 2 - standDepth / 2);
    frontStand.castShadow = true;
    stadiumGroup.add(frontStand);

    const backStandGeometry = new THREE.BoxGeometry(CONFIG.PITCH_WIDTH + 20, standHeight, standDepth);
    const backStand = new THREE.Mesh(backStandGeometry, standMaterial);
    backStand.position.set(0, standHeight / 2, CONFIG.PITCH_HEIGHT / 2 + standDepth / 2);
    backStand.castShadow = true;
    stadiumGroup.add(backStand);

    return stadiumGroup;
}

// ==================== GOALPOSTS & NETS ====================
function createGoals() {
    const goalsGroup = new THREE.Group();
    const goalWidth = 7.32;
    const goalHeight = 2.44;
    const goalDepth = 2;

    function createGoal(x) {
        const goalGroup = new THREE.Group();

        // Posts
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, goalHeight, 16);

        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-goalWidth / 2, goalHeight / 2, x);
        leftPost.castShadow = true;
        goalGroup.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(goalWidth / 2, goalHeight / 2, x);
        rightPost.castShadow = true;
        goalGroup.add(rightPost);

        // Crossbar
        const crossbarGeometry = new THREE.CylinderGeometry(0.1, 0.1, goalWidth, 16);
        const crossbar = new THREE.Mesh(crossbarGeometry, postMaterial);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, goalHeight, x);
        crossbar.castShadow = true;
        goalGroup.add(crossbar);

        // Net
        const netMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide,
            wireframe: true,
            opacity: 0.6,
            transparent: true
        });
        const netGeometry = new THREE.BoxGeometry(goalWidth - 0.3, goalHeight - 0.3, goalDepth);
        const net = new THREE.Mesh(netGeometry, netMaterial);
        net.position.set(0, goalHeight / 2, x + goalDepth / 2);
        goalGroup.add(net);

        return goalGroup;
    }

    const homeGoal = createGoal(-CONFIG.PITCH_HEIGHT / 2);
    const awayGoal = createGoal(CONFIG.PITCH_HEIGHT / 2);

    goalsGroup.add(homeGoal);
    goalsGroup.add(awayGoal);

    return goalsGroup;
}

// ==================== FOOTBALL ====================
function createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.22, 32, 32);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    ball.position.copy(gameState.ballPos);
    return ball;
}

// ==================== PLAYERS ====================
const players = {
    home: [],
    away: []
};

let playerModels = {
    idle: null,
    run: null,
    walk: null,
    tackle: null
};

const loader = new THREE.GLTFLoader();

function loadPlayerModels() {
    return new Promise((resolve) => {
        const modelPaths = {
            idle: 'https://example.com/models/PlayerIdleStand.glb',
            run: 'https://example.com/models/RunningForward.glb',
            walk: 'https://example.com/models/walkForward.glb',
            tackle: 'https://example.com/models/SlideTackle.glb'
        };

        let loadedCount = 0;
        const totalModels = Object.keys(modelPaths).length;

        Object.keys(modelPaths).forEach(key => {
            loader.load(
                modelPaths[key],
                (gltf) => {
                    playerModels[key] = gltf.scene;
                    loadedCount++;
                    if (loadedCount === totalModels) resolve();
                },
                undefined,
                (error) => {
                    console.warn(`Could not load ${key} model:`, error);
                    // Create fallback capsule
                    const geom = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
                    const mat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
                    playerModels[key] = new THREE.Mesh(geom, mat);
                    loadedCount++;
                    if (loadedCount === totalModels) resolve();
                }
            );
        });
    });
}

function createPlayer(x, z, isHomeTeam, index) {
    const playerGroup = new THREE.Group();
    playerGroup.position.set(x, 0, z);
    playerGroup.castShadow = true;
    playerGroup.receiveShadow = true;

    // Use fallback if models not loaded
    let modelMesh;
    if (playerModels.idle) {
        modelMesh = playerModels.idle.clone();
    } else {
        const geom = new THREE.CapsuleGeometry(0.3, 1.8, 4, 8);
        const color = isHomeTeam ? 0xff0000 : 0x0066ff;
        const mat = new THREE.MeshLambertMaterial({ color });
        modelMesh = new THREE.Mesh(geom, mat);
    }

    playerGroup.add(modelMesh);

    const player = {
        mesh: playerGroup,
        position: new THREE.Vector3(x, 0, z),
        velocity: new THREE.Vector3(0, 0, 0),
        isHomeTeam,
        index,
        hasball: false,
        speed: 0.3,
        targetPos: new THREE.Vector3(x, 0, z)
    };

    return player;
}

function setupPlayers() {
    // Home team formation (4-3-3)
    const homeFormation = [
        // Goalkeeper
        { x: -40, z: 0 },
        // Defenders
        { x: -25, z: -15 },
        { x: -25, z: -5 },
        { x: -25, z: 5 },
        { x: -25, z: 15 },
        // Midfielders
        { x: -10, z: -12 },
        { x: -10, z: 0 },
        { x: -10, z: 12 },
        // Forwards
        { x: 15, z: -10 },
        { x: 15, z: 0 },
        { x: 15, z: 10 }
    ];

    // Away team formation (4-3-3)
    const awayFormation = [
        // Goalkeeper
        { x: 40, z: 0 },
        // Defenders
        { x: 25, z: -15 },
        { x: 25, z: -5 },
        { x: 25, z: 5 },
        { x: 25, z: 15 },
        // Midfielders
        { x: 10, z: -12 },
        { x: 10, z: 0 },
        { x: 10, z: 12 },
        // Forwards
        { x: -15, z: -10 },
        { x: -15, z: 0 },
        { x: -15, z: 10 }
    ];

    homeFormation.forEach((pos, idx) => {
        const player = createPlayer(pos.x, pos.z, true, idx);
        players.home.push(player);
        scene.add(player.mesh);
    });

    awayFormation.forEach((pos, idx) => {
        const player = createPlayer(pos.x, pos.z, false, idx);
        players.away.push(player);
        scene.add(player.mesh);
    });
}

// ==================== BALL PHYSICS ====================
let ball;

function updateBall() {
    if (!ball) return;

    // Apply gravity
    gameState.ballVel.y -= 0.01;

    // Velocity damping
    gameState.ballVel.multiplyScalar(0.99);

    // Update position
    gameState.ballPos.add(gameState.ballVel);

    // Pitch boundaries
    const w = CONFIG.PITCH_WIDTH / 2;
    const h = CONFIG.PITCH_HEIGHT / 2;

    if (gameState.ballPos.x > w) gameState.ballPos.x = w;
    if (gameState.ballPos.x < -w) gameState.ballPos.x = -w;
    if (gameState.ballPos.z > h) {
        gameState.ballPos.z = h;
        gameState.ballVel.z *= -0.3;
    }
    if (gameState.ballPos.z < -h) {
        gameState.ballPos.z = -h;
        gameState.ballVel.z *= -0.3;
    }

    // Ground collision
    if (gameState.ballPos.y < 0.22) {
        gameState.ballPos.y = 0.22;
        gameState.ballVel.y *= -0.6;
    }

    ball.position.copy(gameState.ballPos);
}

// ==================== PLAYER AI ====================
function updatePlayerAI() {
    players.home.forEach((player, idx) => {
        // Simple movement pattern
        player.targetPos.x = player.position.x + Math.sin(Date.now() * 0.001 + idx) * 0.1;
        player.targetPos.z = player.position.z + Math.cos(Date.now() * 0.001 + idx) * 0.1;

        const direction = player.targetPos.clone().sub(player.position);
        if (direction.length() > 0.5) {
            direction.normalize().multiplyScalar(player.speed);
            player.position.add(direction);
        }

        player.mesh.position.copy(player.position);
    });

    players.away.forEach((player, idx) => {
        player.targetPos.x = player.position.x + Math.sin(Date.now() * 0.001 + idx) * 0.1;
        player.targetPos.z = player.position.z + Math.cos(Date.now() * 0.001 + idx) * 0.1;

        const direction = player.targetPos.clone().sub(player.position);
        if (direction.length() > 0.5) {
            direction.normalize().multiplyScalar(player.speed);
            player.position.add(direction);
        }

        player.mesh.position.copy(player.position);
    });
}

// ==================== GAME TIME ====================
let lastUpdateTime = Date.now();

function updateGameTime() {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;

    if (!gameState.isPaused) {
        gameState.timeLeft -= deltaTime;

        if (gameState.timeLeft <= 0) {
            if (gameState.isFirstHalf) {
                gameState.isFirstHalf = false;
                gameState.timeLeft = CONFIG.HALF_TIME;
            } else {
                // Match ended
                gameState.isPaused = true;
                gameState.timeLeft = 0;
            }
        }
    }

    updateScoreboard();
}

// ==================== SCOREBOARD ====================
function updateScoreboard() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = Math.floor(gameState.timeLeft % 60);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const scores = document.querySelectorAll('.score');
    scores[0].textContent = gameState.homeScore;
    scores[1].textContent = gameState.awayScore;

    document.querySelector('.time').textContent = timeStr;
    document.querySelector('.period').textContent = gameState.isFirstHalf ? '1ST HALF' : '2ND HALF';
}

// ==================== CONTROLS ====================
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P') {
        gameState.isPaused = !gameState.isPaused;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ==================== ANIMATION LOOP ====================
async function init() {
    // Load models
    await loadPlayerModels();

    // Create scene elements
    const stadium = createStadium();
    scene.add(stadium);

    const goals = createGoals();
    scene.add(goals);

    ball = createBall();
    scene.add(ball);

    setupPlayers();

    // Start game
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (!gameState.isPaused) {
        updateGameTime();
        updateBall();
        updatePlayerAI();
    }

    // Camera follow ball slightly
    const targetCamX = gameState.ballPos.x * 0.3;
    const targetCamZ = gameState.ballPos.z * 0.3 + 60;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;
    camera.lookAt(0, 10, 0);

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
init();
