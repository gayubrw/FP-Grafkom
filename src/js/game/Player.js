import * as THREE from "three";

export class Player {
  constructor(scene, position = { x: 0, y: 0, z: 0 }) {
    this.scene = scene;
    this.position = position;
    this.jumpForce = 0.15;
    this.gravity = -0.008;
    this.velocity = 0;
    this.isJumping = false;

    // Define lanes
    this.lanes = {
      left: -4,
      center: 0,
      right: 4,
    };
    this.currentLane = "center";
    this.isMoving = false;

    // Create player mesh (simple box for now)
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(
      this.lanes[this.currentLane],
      position.y + 1,
      position.z
    );
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // Add trail effect
    this.createTrailEffect();
  }

  moveLeft() {
    if (!this.isMoving) {
      if (this.currentLane === "center") {
        this.currentLane = "left";
        this.animateMove(this.lanes[this.currentLane]);
      } else if (this.currentLane === "right") {
        this.currentLane = "center";
        this.animateMove(this.lanes[this.currentLane]);
      }
    }
  }

  moveRight() {
    if (!this.isMoving) {
      if (this.currentLane === "center") {
        this.currentLane = "right";
        this.animateMove(this.lanes[this.currentLane]);
      } else if (this.currentLane === "left") {
        this.currentLane = "center";
        this.animateMove(this.lanes[this.currentLane]);
      }
    }
  }

  animateMove(targetX) {
    this.isMoving = true;
    const startX = this.mesh.position.x;
    const duration = 200; // milliseconds
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smooth movement
      const easeProgress = this.easeInOutQuad(progress);
      this.mesh.position.x = startX + (targetX - startX) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.mesh.position.x = targetX;
        this.isMoving = false;
      }
    };

    animate();
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  jump() {
    if (!this.isJumping) {
      this.velocity = this.jumpForce;
      this.isJumping = true;
    }
  }

  update(deltaTime) {
    // Apply gravity
    this.velocity += this.gravity;
    this.mesh.position.y += this.velocity;

    // Ground check
    if (this.mesh.position.y < 1) {
      this.mesh.position.y = 1;
      this.velocity = 0;
      this.isJumping = false;
    }

    // Update trail effect
    this.updateTrail();
  }

  createTrailEffect() {
    const trailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const trailMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    });

    this.trail = [];
    this.maxTrailLength = 20;

    for (let i = 0; i < this.maxTrailLength; i++) {
      const trailPart = new THREE.Mesh(trailGeometry, trailMaterial.clone());
      trailPart.visible = false;
      this.scene.add(trailPart);
      this.trail.push(trailPart);
    }
  }

  updateTrail() {
    // Shift trail parts
    for (let i = this.trail.length - 1; i > 0; i--) {
      this.trail[i].position.copy(this.trail[i - 1].position);
      this.trail[i].material.opacity = (1 - i / this.trail.length) * 0.5;
      this.trail[i].visible = true;
    }

    // Update first trail part
    if (this.trail.length > 0) {
      this.trail[0].position.copy(this.mesh.position);
      this.trail[0].position.y -= 0.5;
    }
  }

  getPosition() {
    return this.mesh.position;
  }

  getCollider() {
    return new THREE.Box3().setFromObject(this.mesh);
  }
}
