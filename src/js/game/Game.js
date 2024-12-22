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
      powerPreference: "high-performance",
    });

    // Game state
    this.obstacles = [];
    this.isGameRunning = false;
    this.nextSpawnZ = -100;
    this.difficultyLevel = 1;

    // Pattern system
    this.spawnPatterns = [
      // Single obstacle patterns
      [[-4], [0], [4]],

      // Double obstacle patterns (challenging but possible)
      [
        [-4, 0],
        [0, 4],
        [-4, 4],
      ],

      // Alternating patterns
      [[-4], [4], [-4]],
      [[4], [-4], [4]],
      [[0], [-4], [0], [4]],

      // Zigzag patterns
      [[-4], [0], [4], [0]],
      [[4], [0], [-4], [0]],
    ];
    this.currentPattern = null;
    this.currentPatternIndex = 0;
    this.basePatternDelay = 1500;
    this.minPatternDelay = 800;
    this.lastPatternTime = 0;

    // Distance tracking
    this.distanceTraveled = 0;
    this.lastDistanceUpdate = 0;
    this.distanceUpdateInterval = 0.1;

    // Environment movement settings
    this.environmentSpeed = 0.3;
    this.parallaxFactor = 0.8;

    // Store environment objects
    this.environmentObjects = {
      walls: [],
      pillars: [],
      decorations: [],
      grounds: [],
      torches: [],
    };

    // Initialize game
    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document
      .getElementById("game-container")
      .appendChild(this.renderer.domElement);

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

    // Setup menu handlers
    this.menu.setBackToMenuHandler(() => this.backToMenu());

    // Handle window resize
    window.addEventListener("resize", this.handleResize.bind(this));

    // Start animation loop
    this.animate();

    // Hide loading screen and show menu
    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");
  }

  backToMenu() {
    // Reset game state
    this.isGameRunning = false;

    // Clear obstacles
    this.obstacles.forEach((obstacle) => {
      obstacle.remove(true);
      this.scene.remove(obstacle.mesh);
    });
    this.obstacles = [];

    // Reset player
    this.player.reset();

    // Reset camera
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Reset game variables
    this.distanceTraveled = 0;
    this.lastDistanceUpdate = 0;
    this.nextSpawnZ = -100;
    this.difficultyLevel = 1;
    this.currentPattern = null;
    this.currentPatternIndex = 0;
    this.lastPatternTime = 0;

    // Show menu
    this.menu.showMenu();
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupLights() {
    // Main ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    mainLight.position.set(5, 30, 10);
    mainLight.castShadow = true;

    // Shadow configuration
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

    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4b4b4b, 1.8);
    this.scene.add(hemisphereLight);

    // Accent lights
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

    // Player spotlight
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
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 100);

    const wallGeometry = new THREE.BoxGeometry(2, 10, 50, 1, 5, 20);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0xa0a0a0,
      specular: 0xffffff,
      shininess: 50,
      bumpScale: 0.5,
    });

    // Create wall segments
    for (let z = -100; z <= 100; z += 50) {
      const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
      leftWall.position.set(-11, 5, z);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      this.scene.add(leftWall);
      this.environmentObjects.walls.push(leftWall);

      const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
      rightWall.position.set(11, 5, z);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      this.scene.add(rightWall);
      this.environmentObjects.walls.push(rightWall);
    }

    this.addPillars();
    this.addDecorations();
  }

  addPillars() {
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.6, 10, 8);
    const pillarMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      specular: 0xffffff,
      shininess: 30,
    });

    for (let z = -100; z <= 100; z += 10) {
      const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      leftPillar.position.set(-9, 5, z);
      leftPillar.castShadow = true;
      this.scene.add(leftPillar);
      this.environmentObjects.pillars.push(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      rightPillar.position.set(9, 5, z);
      rightPillar.castShadow = true;
      this.scene.add(rightPillar);
      this.environmentObjects.pillars.push(rightPillar);

      const leftTorch = this.createTorch(-9, z);
      const rightTorch = this.createTorch(9, z);
      if (leftTorch) this.environmentObjects.torches.push(leftTorch);
      if (rightTorch) this.environmentObjects.torches.push(rightTorch);
    }
  }

  createTorch(x, z) {
    const torchGroup = new THREE.Group();
    const torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const torchMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a3810,
    });
    const torch = new THREE.Mesh(torchGeometry, torchMaterial);
    torchGroup.add(torch);

    const torchLight = new THREE.PointLight(0xff6600, 2, 10);
    torchLight.position.y = 1;
    torchGroup.add(torchLight);

    torchGroup.position.set(x * 1.1, 8, z);
    this.scene.add(torchGroup);

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
      color: 0xffd700,
      specular: 0xffffff,
      shininess: 100,
    });

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
    this.groundSpeed = this.environmentSpeed * 1.5;
    this.groundTileLength = 100;

    this.groundGenerationRange = {
      start: -200,
      end: 200,
    };

    const brickTexture = this.createBrickTexture();

    for (
      let z = this.groundGenerationRange.start;
      z <= this.groundGenerationRange.end;
      z += this.groundTileLength
    ) {
      const groundGeometry = new THREE.PlaneGeometry(20, this.groundTileLength);
      const groundMaterial = new THREE.MeshStandardMaterial({
        map: brickTexture,
        roughness: 0.9,
        metalness: 0.1,
        bumpMap: brickTexture,
        bumpScale: 0.1,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.z = z;
      ground.receiveShadow = true;
      ground.isGround = true;
      this.scene.add(ground);
      this.environmentObjects.grounds.push(ground);

      const pathGeometry = new THREE.PlaneGeometry(4, this.groundTileLength);
      const pathMaterial = this.createPathMaterial();
      const path = new THREE.Mesh(pathGeometry, pathMaterial);
      path.rotation.x = -Math.PI / 2;
      path.position.set(0, 0.01, z);
      path.receiveShadow = true;
      path.isGround = true;
      this.scene.add(path);
      this.environmentObjects.grounds.push(path);
    }
  }

  createBrickTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333333";
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
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1a1a1a";
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
      bumpScale: 0.15,
    });
  }

  updateEnvironment() {
    const moveAndReset = (obj, resetDistance, speedFactor = 1) => {
      const speed = obj.isGround ? this.groundSpeed : this.environmentSpeed;
      obj.position.z += speed * speedFactor;

      if (obj.position.z > resetDistance) {
        const resetRange = obj.isGround
          ? this.groundGenerationRange.end - this.groundGenerationRange.start
          : resetDistance * 2;
        obj.position.z -= resetRange;
      }
    };

    // Update walls with parallax effect
    this.environmentObjects.walls.forEach((wall) => {
      moveAndReset(wall, 100, this.parallaxFactor);
    });

    // Update pillars
    this.environmentObjects.pillars.forEach((pillar) => {
      moveAndReset(pillar, 100);
    });

    // Update decorations with slight variation in speed
    this.environmentObjects.decorations.forEach((decoration) => {
      moveAndReset(decoration, 100, 1 + Math.sin(Date.now() * 0.001) * 0.1);
    });

    // Update torches with flame effect
    this.environmentObjects.torches.forEach((torch) => {
      moveAndReset(torch, 100);
    });

    // Update ground segments
    this.environmentObjects.grounds.forEach((ground) => {
      moveAndReset(ground, this.groundTileLength);
    });
  }

  spawnObstacle() {
    if (!this.isGameRunning) return;

    const now = performance.now();

    // Start new pattern if needed
    if (
      !this.currentPattern ||
      this.currentPatternIndex >= this.currentPattern.length
    ) {
      // Calculate delay based on difficulty and distance
      const distanceReduction = Math.min(
        700,
        Math.abs(this.distanceTraveled) * 0.5
      );
      const difficultyReduction = (this.difficultyLevel - 1) * 200;
      const currentDelay = Math.max(
        this.minPatternDelay,
        this.basePatternDelay - distanceReduction - difficultyReduction
      );

      // Check if enough time has passed since last pattern
      if (now - this.lastPatternTime < currentDelay) {
        setTimeout(() => this.spawnObstacle(), 100);
        return;
      }

      // Select new pattern based on difficulty
      let availablePatterns;
      if (this.difficultyLevel === 1) {
        // Easy patterns (single obstacles)
        availablePatterns = this.spawnPatterns.slice(0, 3);
      } else if (this.difficultyLevel === 2) {
        // Medium patterns (single + alternating)
        availablePatterns = this.spawnPatterns.slice(0, 5);
      } else {
        // All patterns available
        availablePatterns = this.spawnPatterns;
      }

      this.currentPattern =
        availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
      this.currentPatternIndex = 0;
      this.lastPatternTime = now;
    }

    // Get current lane(s) from pattern
    const currentLanes = this.currentPattern[this.currentPatternIndex];

    // Spawn obstacles for each lane in the current pattern step
    currentLanes.forEach((lane) => {
      const obstacle = new Obstacle(this.scene, {
        x: lane,
        y: 0,
        z: this.nextSpawnZ,
      });

      // Dynamic speed based on distance and difficulty
      const baseSpeed = 0.35;
      const speedIncrease = 0.08 * (this.difficultyLevel - 1);
      const distanceSpeedBonus = Math.min(
        0.15,
        Math.abs(this.distanceTraveled) * 0.0005
      );
      obstacle.speed = baseSpeed + speedIncrease + distanceSpeedBonus;

      this.obstacles.push(obstacle);
    });

    // Calculate next spawn position
    const baseSpawnInterval = 10;
    const distanceReduction = Math.min(
      4,
      Math.abs(this.distanceTraveled) * 0.01
    );
    const difficultyReduction = this.difficultyLevel - 1;
    const currentSpawnInterval = Math.max(
      6, // Minimum spawn interval
      baseSpawnInterval - distanceReduction - difficultyReduction
    );

    this.nextSpawnZ -= currentSpawnInterval;
    this.currentPatternIndex++;

    // Calculate next spawn time based on current obstacle speed
    const baseSpeed = 0.35;
    const speedIncrease = 0.08 * (this.difficultyLevel - 1);
    const distanceSpeedBonus = Math.min(
      0.15,
      Math.abs(this.distanceTraveled) * 0.0005
    );
    const currentSpeed = baseSpeed + speedIncrease + distanceSpeedBonus;

    const nextSpawnDelay = (currentSpawnInterval / currentSpeed) * 150;
    setTimeout(() => this.spawnObstacle(), nextSpawnDelay);
  }

  updateDistance() {
    this.lastDistanceUpdate += this.deltaTime;
    if (this.lastDistanceUpdate >= this.distanceUpdateInterval) {
      // Calculate distance traveled (negative because we're moving in -Z direction)
      this.distanceTraveled -=
        this.environmentSpeed * this.lastDistanceUpdate * 10;
      this.scoreManager.updateDistance(this.distanceTraveled);
      this.lastDistanceUpdate = 0;

      // Update difficulty based on distance
      if (Math.abs(this.distanceTraveled) >= 300) {
        this.difficultyLevel = 3;
      } else if (Math.abs(this.distanceTraveled) >= 150) {
        this.difficultyLevel = 2;
      }
    }
  }

  update() {
    if (!this.isGameRunning) return;

    // Update environment movement
    this.updateEnvironment();

    // Update distance traveled
    this.updateDistance();

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

      if (
        CollisionDetector.checkCollision(playerBox, obstacleBox) &&
        playerBox.min.y < obstacleBox.max.y
      ) {
        this.gameOver();
        return;
      }

      if (shouldRemove) {
        obstacle.remove();
        this.obstacles.splice(i, 1);
      }
    }
  }

  async gameOver() {
    this.isGameRunning = false;

    // Check for high score and get player name if needed
    await this.scoreManager.checkAndUpdateHighScores();

    // Show game over screen
    this.menu.showGameOver(this.scoreManager.getScore());
  }

  start() {
    this.isGameRunning = true;
    this.scoreManager.resetScore();
    this.distanceTraveled = 0;
    this.lastDistanceUpdate = 0;
    this.difficultyLevel = 1;
    this.currentPattern = null;
    this.currentPatternIndex = 0;
    this.lastPatternTime = 0;
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
    this.obstacles.forEach((obstacle) => obstacle.remove());
    this.obstacles = [];

    // Create initial pattern
    const initialPositions = [-80, -60, -40];
    initialPositions.forEach((z) => {
      const lanes = [-4, 0, 4];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];

      const obstacle = new Obstacle(this.scene, {
        x: lane,
        y: 0,
        z: z,
      });

      obstacle.speed = 0.35; // Base speed for initial obstacles
      this.obstacles.push(obstacle);
    });
  }

  restart() {
    // Reset game state
    this.obstacles.forEach((obstacle) => {
      obstacle.remove(true);
      this.scene.remove(obstacle.mesh);
    });
    this.obstacles = [];

    // Reset player
    this.player.reset();

    // Reset distance and spawn system
    this.distanceTraveled = 0;
    this.lastDistanceUpdate = 0;
    this.nextSpawnZ = -100;
    this.difficultyLevel = 1;
    this.currentPattern = null;
    this.currentPatternIndex = 0;
    this.lastPatternTime = 0;

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
