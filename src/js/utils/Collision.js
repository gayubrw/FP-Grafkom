export class CollisionDetector {
  static checkCollision(playerCollider, obstacleCollider) {
    return playerCollider.intersectsBox(obstacleCollider);
  }
}
