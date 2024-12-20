import * as THREE from "three";
import { Player } from "./Player.js";
import { Obstacle } from "./Obstacle.js";
import { ScoreManager } from "./ScoreManager.js";
import { Controls } from "../utils/Controls.js";
import { CollisionDetector } from "../utils/Collision.js";
import { Menu } from "../ui/Menu.js";
import { HUD } from "../ui/HUD.js";

export class Game {
    constructor() {
        // Initialize core components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });

        // Game state
        this.obstacles = [];
        this.isGameRunning = false;
        this.nextSpawnZ = -100;
        this.baseSpawnInterval = 20;
        this.minSpawnInterval = 15;
        this.spawnIntervalReduction = 0.2;
        this.lastLaneUsed = null;
        this.difficultyLevel = 1;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem("highScore")) || 0;

        // Environment movement settings
        this.environmentSpeed = 0.3;
        this.parallaxFactor = 0.8; // For background elements
        
        // Store environment objects
        this.environmentObjects = {
            walls: [],
            pillars: [],
            decorations: [],
            grounds: [],
            torches: []
        };

        // Initialize game
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById("game-container").appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup game components
        this.setupLights();
        this.setupEnvironment();
        this.setupGround();

        // Initialize game objects
        this.player = new Player(this.scene);
        this.controls = new Controls(this.player);
        this.scoreManager = new ScoreManager();
        this.menu = new Menu();
        this.hud = new HUD();

        // Handle window resize
        window.addEventListener("resize", this.handleResize.bind(this));

        // Start animation loop
        this.animate();

        // Hide loading screen and show menu
        document.getElementById("loading-screen").classList.add("hidden");
        document.getElementById("menu-screen").classList.remove("hidden");
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupLights() {
        // Main ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        this.scene.add(ambientLight);
    
        // Main directional light (sun-like)
        const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
        mainLight.position.set(5, 30, 10);
        mainLight.castShadow = true;
        
        // Enhanced shadow configuration
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 200;
        mainLight.shadow.camera.left = -30;
        mainLight.shadow.camera.right = 30;
        mainLight.shadow.camera.top = 30;
        mainLight.shadow.camera.bottom = -30;
        mainLight.shadow.mapSize.width = 4096;
        mainLight.shadow.mapSize.height = 4096;
        mainLight.shadow.bias = -0.0005;
        mainLight.shadow.normalBias = 0.02;
        
        this.scene.add(mainLight);
    
        // Hemisphere light for natural sky-ground reflection
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4B4B4B, 1.8);
        this.scene.add(hemisphereLight);
    
        // Additional accent lights
        const leftAccent = new THREE.SpotLight(0xff7f00, 3);
        leftAccent.position.set(-15, 20, 0);
        leftAccent.angle = Math.PI / 6;
        leftAccent.penumbra = 0.3;
        leftAccent.decay = 1.5;
        this.scene.add(leftAccent);

        const rightAccent = new THREE.SpotLight(0xff7f00, 3);
        rightAccent.position.set(15, 20, 0);
        rightAccent.angle = Math.PI / 6;
        rightAccent.penumbra = 0.3;
        rightAccent.decay = 1.5;
        this.scene.add(rightAccent);
        
        // Player spotlight for dramatic effect
        const playerLight = new THREE.SpotLight(0xffffff, 2.5);
        playerLight.position.set(0, 15, 5);
        playerLight.target.position.set(0, 0, 0);
        playerLight.angle = Math.PI / 8;
        playerLight.penumbra = 0.2;
        playerLight.decay = 1.5;
        this.scene.add(playerLight);
        this.scene.add(playerLight.target);
    }

    setupEnvironment() {
        // Scene background and fog
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

        // Temple walls - Create multiple segments
        const wallGeometry = new THREE.BoxGeometry(2, 10, 50, 1, 5, 20);
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0xA0A0A0,
            specular: 0xFFFFFF,
            shininess: 50,
            bumpScale: 0.5
        });

        // Create multiple wall segments
        for (let z = -100; z <= 100; z += 50) {
            // Left wall segments
            const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
            leftWall.position.set(-11, 5, z);
            leftWall.castShadow = true;
            leftWall.receiveShadow = true;
            this.scene.add(leftWall);
            this.environmentObjects.walls.push(leftWall);

            // Right wall segments
            const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
            rightWall.position.set(11, 5, z);
            rightWall.castShadow = true;
            rightWall.receiveShadow = true;
            this.scene.add(rightWall);
            this.environmentObjects.walls.push(rightWall);
        }

        // Add pillars and decorations
        this.addPillars();
        this.addDecorations();
    }

    addPillars() {
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.6, 10, 8);
        const pillarMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            specular: 0xFFFFFF,
            shininess: 30
        });

        // Create pillars at regular intervals
        for (let z = -100; z <= 100; z += 10) {
            // Left pillars
            const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            leftPillar.position.set(-9, 5, z);
            leftPillar.castShadow = true;
            this.scene.add(leftPillar);
            this.environmentObjects.pillars.push(leftPillar);

            // Right pillars
            const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            rightPillar.position.set(9, 5, z);
            rightPillar.castShadow = true;
            this.scene.add(rightPillar);
            this.environmentObjects.pillars.push(rightPillar);

            // Add torches to pillars
            const leftTorch = this.createTorch(-9, z);
            const rightTorch = this.createTorch(9, z);
            if (leftTorch) this.environmentObjects.torches.push(leftTorch);
            if (rightTorch) this.environmentObjects.torches.push(rightTorch);
        }
    }

    createTorch(x, z) {
        // Torch base
        const torchGroup = new THREE.Group();
        const torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const torchMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a3810
        });
        const torch = new THREE.Mesh(torchGeometry, torchMaterial);
        torchGroup.add(torch);

        // Torch flame (point light)
        const torchLight = new THREE.PointLight(0xff6600, 2, 10);
        torchLight.position.y = 1;
        torchGroup.add(torchLight);

        // Position the torch group
        torchGroup.position.set(x * 1.1, 8, z);
        this.scene.add(torchGroup);

        // Add flame animation
        const animate = () => {
            if (this.isGameRunning) {
                torchLight.intensity = 1.5 + Math.random() * 1;
            }
            requestAnimationFrame(animate);
        };
        animate();

        return torchGroup;
    }

    addDecorations() {
        const decorGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const decorMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            specular: 0xFFFFFF,
            shininess: 100
        });

        // Add decorative elements along the walls
        for (let z = -100; z <= 100; z += 10) {
            const leftDecor = new THREE.Mesh(decorGeometry, decorMaterial);
            leftDecor.position.set(-8.5, 1, z);
            this.scene.add(leftDecor);
            this.environmentObjects.decorations.push(leftDecor);

            const rightDecor = new THREE.Mesh(decorGeometry, decorMaterial);
            rightDecor.position.set(8.5, 1, z);
            this.scene.add(rightDecor);
            this.environmentObjects.decorations.push(rightDecor);
        }
    }

    setupGround() {
        // Ground settings
        this.groundSpeed = this.environmentSpeed * 1.5; // Increased ground speed
        this.groundTileLength = 100; // Increased tile length for smoother movement

        // Extended generation range
        this.groundGenerationRange = {
            start: -200,
            end: 200
        };

        // Create brick texture
        const brickTexture = this.createBrickTexture();
        
        // Create ground segments with extended range
        for (let z = this.groundGenerationRange.start; z <= this.groundGenerationRange.end; z += this.groundTileLength) {
            // Main ground
            const groundGeometry = new THREE.PlaneGeometry(20, this.groundTileLength);
            const groundMaterial = new THREE.MeshStandardMaterial({ 
                map: brickTexture,
                roughness: 0.9,
                metalness: 0.1,
                bumpMap: brickTexture,
                bumpScale: 0.1
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.z = z;
            ground.receiveShadow = true;
            ground.isGround = true; // Mark as ground object
            this.scene.add(ground);
            this.environmentObjects.grounds.push(ground);

            // Path
            const pathGeometry = new THREE.PlaneGeometry(4, this.groundTileLength);
            const pathMaterial = this.createPathMaterial();
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            path.rotation.x = -Math.PI / 2;
            path.position.set(0, 0.01, z);
            path.receiveShadow = true;
            path.isGround = true; // Mark as ground object
            this.scene.add(path);
            this.environmentObjects.grounds.push(path);
        }
    }

    createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Draw brick pattern
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333333';
        for (let y = 0; y < canvas.height; y += 32) {
            const offset = (Math.floor(y / 32) % 2) * 64;
            for (let x = -64; x < canvas.width + 64; x += 64) {
                ctx.fillRect(x + offset, y, 60, 28);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 50);
        
        return texture;
    }

    createPathMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#1a1a1a';
        for (let y = 0; y < canvas.height; y += 32) {
            const offset = (Math.floor(y / 32) % 2) * 64;
            for (let x = -64; x < canvas.width + 64; x += 64) {
                ctx.fillRect(x + offset, y, 60, 28);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 50);

        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.1,
            bumpMap: texture,
            bumpScale: 0.15
        });
    }

    updateEnvironment() {
        const moveAndReset = (obj, resetDistance, speedFactor = 1) => {
            // Use groundSpeed for ground objects, environmentSpeed for others
            const speed = obj.isGround ? this.groundSpeed : this.environmentSpeed;
            obj.position.z += speed * speedFactor;
            
            // Reset position with extended range for ground
            if (obj.position.z > resetDistance) {
                const resetRange = obj.isGround ? 
                    (this.groundGenerationRange.end - this.groundGenerationRange.start) :
                    resetDistance * 2;
                obj.position.z -= resetRange;
            }
        };

        // Update walls with parallax effect
        this.environmentObjects.walls.forEach(wall => {
            moveAndReset(wall, 100, this.parallaxFactor);
        });

        // Update pillars
        this.environmentObjects.pillars.forEach(pillar => {
            moveAndReset(pillar, 100);
        });

        // Update decorations with slight variation in speed
        this.environmentObjects.decorations.forEach(decoration => {
            moveAndReset(decoration, 100, 1 + Math.sin(Date.now() * 0.001) * 0.1);
        });

        // Update torches with flame effect
        this.environmentObjects.torches.forEach(torch => {
            moveAndReset(torch, 100);
        });

        // Update ground segments
        this.environmentObjects.grounds.forEach(ground => {
            moveAndReset(ground, this.groundTileLength);
        });
    }

    spawnObstacle() {
        if (!this.isGameRunning) return;

        const lanes = [-4, 0, 4];
        const validLanes = this.lastLaneUsed !== null && this.difficultyLevel === 1 
            ? lanes.filter(lane => lane !== this.lastLaneUsed)
            : lanes;

        const lane = validLanes[Math.floor(Math.random() * validLanes.length)];
        this.lastLaneUsed = lane;

        const obstacle = new Obstacle(this.scene, {
            x: lane,
            y: 0,
            z: this.nextSpawnZ
        });

        // Update obstacle speed based on difficulty
        const baseSpeed = 0.3;
        const speedIncrease = 0.05 * (this.difficultyLevel - 1);
        obstacle.speed = baseSpeed + speedIncrease;

        this.obstacles.push(obstacle);

        // Calculate next spawn interval
        const scoreReduction = this.scoreManager.getScore() * this.spawnIntervalReduction;
        const currentSpawnInterval = Math.max(this.minSpawnInterval, this.baseSpawnInterval - scoreReduction);
        this.nextSpawnZ -= currentSpawnInterval;

        // Schedule next spawn
        const spawnDelay = (currentSpawnInterval / obstacle.speed) * 200;
        setTimeout(() => this.spawnObstacle(), spawnDelay);
    }

    start() {
        this.isGameRunning = true;
        this.scoreManager.resetScore();
        this.difficultyLevel = 1;
        this.lastLaneUsed = null;
        this.nextSpawnZ = -100;
        
        // Setup initial obstacles
        this.setupInitialObstacles();
        
        // Start spawning
        setTimeout(() => this.spawnObstacle(), 2000);

        // Show game UI
        this.menu.showGame();
    }

    setupInitialObstacles() {
        // Clear existing obstacles
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.obstacles = [];

        // Create initial pattern
        const initialPositions = [-80, -60, -40];
        initialPositions.forEach(z => {
            const lanes = [-4, 0, 4];
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            
            const obstacle = new Obstacle(this.scene, {
                x: lane,
                y: 0,
                z: z
            });
            this.obstacles.push(obstacle);
        });
    }

    update() {
        if (!this.isGameRunning) return;

        // Update environment movement
        this.updateEnvironment();

        // Update player and controls
        this.controls.update();
        this.player.update(this.deltaTime);

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const shouldRemove = obstacle.update();

            // Collision detection
            const playerBox = this.player.getCollider();
            const obstacleBox = obstacle.getCollider();
            
            if (CollisionDetector.checkCollision(playerBox, obstacleBox) && 
                playerBox.min.y < obstacleBox.max.y) {
                this.gameOver();
                return;
            }

            if (shouldRemove) {
                obstacle.remove();
                this.obstacles.splice(i, 1);
                this.scoreManager.incrementScore();

                // Update difficulty
                const score = this.scoreManager.getScore();
                if (score >= 30) this.difficultyLevel = 3;
                else if (score >= 15) this.difficultyLevel = 2;
            }
        }
    }

    gameOver() {
        this.isGameRunning = false;
        this.menu.showGameOver(this.scoreManager.getScore());
    }

    restart() {
        // Reset game state - immediately remove all obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.remove(true); // true for immediate removal
            this.scene.remove(obstacle.mesh);
        });
        this.obstacles = [];
        
        // Reset player
        this.player.reset();
            
        // Reset spawn system
        this.nextSpawnZ = -100;
        this.difficultyLevel = 1;
        this.lastLaneUsed = null;

        // Start new game
        this.start();
    }

    animate(time) {
        requestAnimationFrame(this.animate.bind(this));

        // Calculate delta time
        if (!this.prevTime) this.prevTime = time;
        this.deltaTime = (time - this.prevTime) / 1000;
        this.prevTime = time;

        // Update game state
        this.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}