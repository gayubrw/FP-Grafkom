export class Menu {
  constructor() {
    this.menuScreen = document.getElementById("menu-screen");
    this.gameUI = document.getElementById("game-ui");
    this.gameOver = document.getElementById("game-over");
  }

  showMenu() {
    this.menuScreen.classList.remove("hidden");
    this.gameUI.classList.add("hidden");
    this.gameOver.classList.add("hidden");
  }

  showGame() {
    this.menuScreen.classList.add("hidden");
    this.gameUI.classList.remove("hidden");
    this.gameOver.classList.add("hidden");
  }

  showGameOver(finalScore) {
    this.menuScreen.classList.add("hidden");
    this.gameUI.classList.add("hidden");
    this.gameOver.classList.remove("hidden");
    document.getElementById("final-score").textContent = finalScore;
  }
}
