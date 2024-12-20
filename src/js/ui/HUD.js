export class HUD {
  constructor() {
    this.scoreDisplay = document.getElementById("score");
    this.highScoreDisplay = document.getElementById("high-score");
  }

  updateScore(score) {
    this.scoreDisplay.textContent = `Score: ${score}`;
  }

  updateHighScore(highScore) {
    this.highScoreDisplay.textContent = `High Score: ${highScore}`;
  }
}
