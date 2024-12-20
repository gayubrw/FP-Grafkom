export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("highScore")) || 0;
    this.scoreElement = document.getElementById("score");
    this.highScoreElement = document.getElementById("high-score");
    this.updateDisplay();
  }

  incrementScore(amount = 1) {
    this.score += amount;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore);
    }
    this.updateDisplay();
  }

  resetScore() {
    this.score = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    this.scoreElement.textContent = `Score: ${this.score}`;
    this.highScoreElement.textContent = `High Score: ${this.highScore}`;
  }

  getScore() {
    return this.score;
  }
}
