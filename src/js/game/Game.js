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
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.obstacles = [];
    this.isGameRunning = false;
    this.nextSpawnZ = -100; // Posisi awal spawn yang lebih jauh
    this.spawnInterval = 20; // Jarak antar obstacle

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document
      .getElementById("game-container")
      .appendChild(this.renderer.domElement);

    // Hide loading screen and show menu
    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");

    // Setup camera
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Setup lights
    this.setupLights();

    // Setup environment
    this.setupEnvironment();

    // Setup ground
    this.setupGround();

    // Initialize components
    this.player = new Player(this.scene);
    this.controls = new Controls(this.player);
    this.scoreManager = new ScoreManager();
    this.menu = new Menu();
    this.hud = new HUD();

    // Handle window resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.animate();
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Add point lights for temple atmosphere
    const leftLight = new THREE.PointLight(0xff7f00, 1, 20);
    leftLight.position.set(-8, 5, 0);
    this.scene.add(leftLight);

    const rightLight = new THREE.PointLight(0xff7f00, 1, 20);
    rightLight.position.set(8, 5, 0);
    this.scene.add(rightLight);
  }

  setupEnvironment() {
    // Scene background
    this.scene.background = new THREE.Color(0x000033);
    this.scene.fog = new THREE.Fog(0x000033, 20, 100);

    // Ground with better material
    const groundGeometry = new THREE.PlaneGeometry(20, 100, 40, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c3c3c,
      metalness: 0.2,
      roughness: 0.8,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Temple walls with detailed geometry
    const wallGeometry = new THREE.BoxGeometry(2, 10, 100, 1, 5, 20);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x505050,
      specular: 0x111111,
      shininess: 30,
      bumpScale: 0.5,
    });

    // Add temple pillars
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
    const pillarMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      specular: 0x111111,
      shininess: 30,
    });

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-11, 5, 0);
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(11, 5, 0);
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // Add pillars along the path
    for (let z = -40; z <= 40; z += 10) {
      const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      leftPillar.position.set(-9, 5, z);
      leftPillar.castShadow = true;
      this.scene.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      rightPillar.position.set(9, 5, z);
      rightPillar.castShadow = true;
      this.scene.add(rightPillar);
    }

    // Add torches on pillars
    this.createTorchEffect();
  }

  createTorchEffect() {
    // Torch light animation
    const torchLight = (x, z) => {
      const light = new THREE.PointLight(0xff6600, 1, 8);
      light.position.set(x, 8, z);
      this.scene.add(light);

      // Animate torch light
      const intensity = { value: 1 };
      const animate = () => {
        intensity.value = 0.8 + Math.random() * 0.4;
        light.intensity = intensity.value;
        requestAnimationFrame(animate);
      };
      animate();
    };

    // Add torches at intervals
    for (let z = -40; z <= 40; z += 10) {
      torchLight(-9, z);
      torchLight(9, z);
    }
  }

  setupGround() {
    const groundGeometry = new THREE.PlaneGeometry(20, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  start() {
    this.isGameRunning = true;
    this.scoreManager.resetScore();
    this.menu.showGame();

    // Setup obstacle awal
    this.setupInitialObstacles();

    // Mulai spawn berikutnya
    this.spawnObstacle();
  }

  setupInitialObstacles() {
    // Bersihkan obstacle yang ada
    this.obstacles.forEach((obstacle) => obstacle.remove());
    this.obstacles = [];

    // Spawn beberapa obstacle dari jarak jauh
    const lanes = [-4, 0, 4];
    for (let z = -100; z <= -20; z += this.spawnInterval) {
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

      const obstacle = new Obstacle(this.scene, {
        x: randomLane,
        y: 0,
        z: z,
      });
      this.obstacles.push(obstacle);
    }

    this.nextSpawnZ = -100; // Reset posisi spawn berikutnya
  }

  spawnObstacle() {
    if (this.isGameRunning) {
      const lanes = [-4, 0, 4];
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

      const obstacle = new Obstacle(this.scene, {
        x: randomLane,
        y: 0,
        z: this.nextSpawnZ,
      });
      this.obstacles.push(obstacle);

      // Update posisi spawn berikutnya
      this.nextSpawnZ -= this.spawnInterval;

      // Hitung timing spawn berikutnya berdasarkan kecepatan
      const spawnDelay = (this.spawnInterval / 0.3) * 200; // 0.3 adalah kecepatan obstacle
      setTimeout(() => this.spawnObstacle(), spawnDelay);
    }
  }

  restart() {
    // Clear existing obstacles
    this.obstacles.forEach((obstacle) => obstacle.remove());
    this.obstacles = [];

    // Reset player position
    this.player.mesh.position.set(0, 1, 0);
    this.nextSpawnZ = -100; // Reset spawn position

    // Start new game
    this.start();
  }

  update() {
    if (this.isGameRunning) {
      this.controls.update();
      this.player.update(this.deltaTime);

      // Update obstacles
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obstacle = this.obstacles[i];
        const shouldRemove = obstacle.update();

        // Check collision
        if (
          CollisionDetector.checkCollision(
            this.player.getCollider(),
            obstacle.getCollider()
          )
        ) {
          this.gameOver();
          return;
        }

        // Remove obstacle if it's passed
        if (shouldRemove) {
          obstacle.remove();
          this.obstacles.splice(i, 1);
          this.scoreManager.incrementScore();
        }
      }
    }
  }

  animate(time) {
    requestAnimationFrame(this.animate.bind(this));

    // Calculate delta time
    if (!this.prevTime) this.prevTime = time;
    this.deltaTime = (time - this.prevTime) / 1000;
    this.prevTime = time;

    // Update game logic
    this.update();

    this.renderer.render(this.scene, this.camera);
  }
}
