import * as THREE from "three";

export class Player {
    constructor(scene, position = { x: 0, y: 0, z: 4 }) {
        this.scene = scene;
        this.position = position;

        // Konstanta fisika
        this.GROUND_LEVEL = 1;
        this.JUMP_HEIGHT = 3.5;
        this.JUMP_DURATION = 0.5;
        this.gravity = -(2 * this.JUMP_HEIGHT) / Math.pow(this.JUMP_DURATION / 2, 2);
        this.jumpForce = -this.gravity * (this.JUMP_DURATION / 2);
        
        // State player
        this.velocity = 0;
        this.isJumping = false;
        this.jumpCooldown = false;
        this.jumpCooldownTime = 500;

        // Lane management
        this.lanes = {
            left: -4,
            center: 0,
            right: 4
        };
        this.currentLane = "center";
        this.isMoving = false;
        this.movementSpeed = 0.2;
        this.laneTransitionDuration = 200; // ms

        this.createMesh();
        this.createEffects();
    }

    createMesh() {
        // Group utama untuk player
        this.playerGroup = new THREE.Group();

        // Body player
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            specular: 0x009900,
            shininess: 30
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.castShadow = true;

        // Head player
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x00dd00,
            specular: 0x009900,
            shininess: 30
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1;
        this.head.castShadow = true;

        // Add meshes ke group
        this.playerGroup.add(this.body);
        this.playerGroup.add(this.head);

        // Set posisi awal
        this.playerGroup.position.set(
            this.lanes[this.currentLane],
            this.GROUND_LEVEL,
            this.position.z
        );

        // Add ke scene
        this.scene.add(this.playerGroup);
    }

    createEffects() {
        this.createTrailEffect();
        this.createGlowEffect();
    }

    createTrailEffect() {
        // Setup trail
        const trailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const trailMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });

        this.trail = [];
        this.maxTrailLength = 20;

        // Create trail segments
        for (let i = 0; i < this.maxTrailLength; i++) {
            const trailPart = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trailPart.visible = false;
            this.scene.add(trailPart);
            this.trail.push(trailPart);
        }
    }

    createGlowEffect() {
        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.2
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.playerGroup.add(this.glowMesh);

        // Animate glow
        const animateGlow = () => {
            if (this.glowMesh) {
                this.glowMesh.material.opacity = 0.1 + Math.sin(Date.now() * 0.005) * 0.1;
                requestAnimationFrame(animateGlow);
            }
        };
        animateGlow();
    }

    update(deltaTime) {
        if (!deltaTime) return;

        // Update physics
        if (this.isJumping) {
            this.velocity += this.gravity * deltaTime;
            this.playerGroup.position.y += this.velocity * deltaTime;

            // Ground check
            if (this.playerGroup.position.y <= this.GROUND_LEVEL) {
                this.land();
            }
        } else {
            // Idle floating animation
            const floatOffset = Math.sin(Date.now() * 0.003) * 0.05;
            this.playerGroup.position.y = this.GROUND_LEVEL + floatOffset;
        }

        // Update trail
        this.updateTrail();
    }

    updateTrail() {
        // Update trail positions
        for (let i = this.trail.length - 1; i > 0; i--) {
            this.trail[i].position.copy(this.trail[i - 1].position);
            this.trail[i].material.opacity = (1 - i / this.trail.length) * 0.5;
            this.trail[i].visible = true;
        }

        // Update first trail part
        if (this.trail.length > 0) {
            this.trail[0].position.copy(this.playerGroup.position);
            this.trail[0].position.y -= 0.5;
        }
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
        const startX = this.playerGroup.position.x;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.laneTransitionDuration, 1);

            // Smooth easing
            const easeProgress = this.easeInOutQuad(progress);
            this.playerGroup.position.x = startX + (targetX - startX) * easeProgress;

            // Tilt effect
            const tiltAngle = (targetX - startX > 0 ? -1 : 1) * Math.PI / 6;
            this.playerGroup.rotation.z = tiltAngle * (1 - easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.playerGroup.position.x = targetX;
                this.playerGroup.rotation.z = 0;
                this.isMoving = false;
            }
        };

        animate();
    }

    jump() {
        if (!this.isJumping && !this.jumpCooldown) {
            this.isJumping = true;
            this.jumpCooldown = true;
            this.velocity = this.jumpForce;

            // Jump animation
            this.startJumpAnimation();

            // Reset cooldown
            setTimeout(() => {
                this.jumpCooldown = false;
            }, this.jumpCooldownTime);
        }
    }

    land() {
        this.playerGroup.position.y = this.GROUND_LEVEL;
        this.velocity = 0;
        this.isJumping = false;
        this.startLandingAnimation();
    }

    startJumpAnimation() {
        // Initial squash
        this.playerGroup.scale.y = 0.7;
        this.playerGroup.scale.x = 1.3;

        // Stretch animation
        const stretch = () => {
            this.playerGroup.scale.y = 1.3;
            this.playerGroup.scale.x = 0.8;
            setTimeout(() => this.resetScale(), 100);
        };

        setTimeout(stretch, 50);
    }

    startLandingAnimation() {
        // Landing squash
        this.playerGroup.scale.y = 0.6;
        this.playerGroup.scale.x = 1.4;
        this.resetScale();
    }

    resetScale() {
        const animate = () => {
            const targetScale = 1;
            const springSpeed = 0.2;

            this.playerGroup.scale.y += (targetScale - this.playerGroup.scale.y) * springSpeed;
            this.playerGroup.scale.x += (targetScale - this.playerGroup.scale.x) * springSpeed;

            if (Math.abs(this.playerGroup.scale.y - targetScale) > 0.01) {
                requestAnimationFrame(animate);
            } else {
                this.playerGroup.scale.set(1, 1, 1);
            }
        };

        requestAnimationFrame(animate);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    getPosition() {
        return this.playerGroup.position;
    }

    getCollider() {
        return new THREE.Box3().setFromObject(this.playerGroup);
    }

    reset() {
        this.playerGroup.position.set(0, this.GROUND_LEVEL, 4);
        this.velocity = 0;
        this.isJumping = false;
        this.currentLane = "center";
        this.isMoving = false;
        this.playerGroup.rotation.set(0, 0, 0);
        this.playerGroup.scale.set(1, 1, 1);
    }
}