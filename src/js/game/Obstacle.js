import * as THREE from "three";

export class Obstacle {
  constructor(scene, position = { x: 0, y: 0, z: -20 }) {
    this.scene = scene;

    // Create obstacle group
    this.mesh = new THREE.Group();

    // Base
    const baseGeom = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const baseMesh = new THREE.Mesh(
      baseGeom,
      new THREE.MeshPhongMaterial({ color: 0x8b0000 })
    );

    // Top
    const topGeom = new THREE.ConeGeometry(0.75, 2, 4);
    const topMesh = new THREE.Mesh(
      topGeom,
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    topMesh.position.y = 1.25;

    this.mesh.add(baseMesh);
    this.mesh.add(topMesh);

    // Set position
    this.mesh.position.set(position.x, position.y + 0.25, position.z);
    baseMesh.castShadow = true;
    topMesh.castShadow = true;

    scene.add(this.mesh);

    this.speed = 0.3; // Sesuaikan kecepatan untuk pengalaman yang lebih baik

    // Add glow effect
    this.addGlowEffect();
  }

  addGlowEffect() {
    const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.2,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glowMesh);

    // Animate glow
    const animate = () => {
      if (this.glowMesh) {
        this.glowMesh.material.opacity =
          0.1 + Math.sin(Date.now() * 0.005) * 0.1;
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  update() {
    // Update posisi
    this.mesh.position.z += this.speed;

    // Return true jika obstacle sudah melewati player
    return this.mesh.position.z > 10;
  }

  remove() {
    this.scene.remove(this.mesh);
    this.mesh.children.forEach((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  getCollider() {
    return new THREE.Box3().setFromObject(this.mesh);
  }
}
