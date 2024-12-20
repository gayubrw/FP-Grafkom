export class ScoreManager {
  constructor() {
    this.distanceTraveled = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("highScore")) || 0;
    this.scoreElement = document.getElementById("score");
    this.highScoreElement = document.getElementById("high-score");
    this.updateDisplay();
  }

  updateDistance(distance) {
    this.distanceTraveled = distance;
    // Convert distance to score (1 point per meter)
    this.score = Math.floor(Math.abs(this.distanceTraveled));
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore);
    }
    this.updateDisplay();
  }

  resetScore() {
    this.distanceTraveled = 0;
    this.score = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    this.scoreElement.textContent = `Distance: ${this.score}m`;
    this.highScoreElement.textContent = `Best: ${this.highScore}m`;
  }

  getScore() {
    return this.score;
  }
}