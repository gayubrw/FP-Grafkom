import * as THREE from "three";

export class Obstacle {
  constructor(scene, position = { x: 0, y: 0, z: -20 }) {
    this.scene = scene;
    this.speed = 0.3;
    this.isDestroyed = false;
    
    // Create main mesh group
    this.mesh = new THREE.Group();
    
    // Create obstacle parts
    this.createObstacleMesh();
    
    // Set initial position
    this.mesh.position.set(position.x, position.y + 0.25, position.z);
    
    // Add to scene
    scene.add(this.mesh);
    
    // Add effects
    this.createGlowEffect();
    this.createParticleSystem();
    this.addPulsingAnimation();
  }

  createObstacleMesh() {
    // Base geometry
    const baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b0000,
      specular: 0x660000,
      shininess: 30,
      emissive: 0x330000
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.castShadow = true;

    // Top spike
    const spikeGeometry = new THREE.ConeGeometry(0.75, 2, 4);
    const spikeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      specular: 0x990000,
      shininess: 30,
      emissive: 0x330000
    });
    const spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spikeMesh.position.y = 1.25;
    spikeMesh.castShadow = true;

    // Add details to base
    const detailGeometry = new THREE.BoxGeometry(1.6, 0.1, 1.6);
    const detailMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      specular: 0x990000,
      shininess: 30
    });
    const topDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    topDetail.position.y = 0.3;

    const bottomDetail = new THREE.Mesh(detailGeometry, detailMaterial);
    bottomDetail.position.y = -0.3;

    // Add all parts to group
    this.mesh.add(baseMesh);
    this.mesh.add(spikeMesh);
    this.mesh.add(topDetail);
    this.mesh.add(bottomDetail);

    // Store references for animations
    this.baseMesh = baseMesh;
    this.spikeMesh = spikeMesh;
  }

  createGlowEffect() {
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.15
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glowMesh);

    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.2
    });
    this.innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    this.mesh.add(this.innerGlowMesh);
  }

  createParticleSystem() {
    // Particle geometry
    const particleCount = 20;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Random position around obstacle
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Red color with variation
      colors[i * 3] = 1;  // Red
      colors[i * 3 + 1] = Math.random() * 0.3;  // Green
      colors[i * 3 + 2] = Math.random() * 0.3;  // Blue
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    // Create particle system
    this.particles = new THREE.Points(particles, particleMaterial);
    this.mesh.add(this.particles);
  }

  addPulsingAnimation() {
    // Pulsing animation for glow
    const pulseGlow = () => {
      if (!this.isDestroyed) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.2;
        if (this.glowMesh) {
          this.glowMesh.material.opacity = pulse;
        }
        if (this.innerGlowMesh) {
          this.innerGlowMesh.material.opacity = pulse + 0.1;
        }
        requestAnimationFrame(pulseGlow);
      }
    };
    pulseGlow();

    // Rotation animation for spike
    const rotateSpikeAndParticles = () => {
      if (!this.isDestroyed) {
        if (this.spikeMesh) {
          this.spikeMesh.rotation.y += 0.02;
        }
        if (this.particles) {
          this.particles.rotation.y -= 0.01;
        }
        requestAnimationFrame(rotateSpikeAndParticles);
      }
    };
    rotateSpikeAndParticles();
  }

  update() {
    // Move obstacle forward
    this.mesh.position.z += this.speed;

    // Update particle positions
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Return true if obstacle should be removed
    return this.mesh.position.z > 10;
  }

  remove() {
    this.isDestroyed = true;

    // Add destruction effect
    this.createDestructionEffect();

    // Remove from scene
    setTimeout(() => {
      this.scene.remove(this.mesh);
      this.dispose();
    }, 1000);
  }

  createDestructionEffect() {
    // Create explosion particles
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = this.mesh.position.x;
      positions[i * 3 + 1] = this.mesh.position.y;
      positions[i * 3 + 2] = this.mesh.position.z;

      // Color
      colors[i * 3] = 1;     // Red
      colors[i * 3 + 1] = 0; // Green
      colors[i * 3 + 2] = 0; // Blue

      // Velocity
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.2,
        z: (Math.random() - 0.5) * 0.3
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Animate explosion
    const animateExplosion = () => {
      const positions = particles.geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;
        velocities[i].y -= 0.01; // Gravity
      }

      particles.geometry.attributes.position.needsUpdate = true;
      material.opacity -= 0.02;

      if (material.opacity > 0) {
        requestAnimationFrame(animateExplosion);
      } else {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    };

    animateExplosion();
  }

  dispose() {
    // Dispose geometries and materials
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  getCollider() {
    return new THREE.Box3().setFromObject(this.mesh);
  }

  setSpeed(speed) {
    this.speed = speed;
  }
}