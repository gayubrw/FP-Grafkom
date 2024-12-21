export class Menu {
  constructor() {
    this.menuScreen = document.getElementById("menu-screen");
    this.gameUI = document.getElementById("game-ui");
    this.gameOver = document.getElementById("game-over");
    this.instructionsModal = document.getElementById("instructions-modal");

    // Setup instructions modal
    document
      .getElementById("instructions-button")
      .addEventListener("click", () => {
        this.showInstructions();
      });

    document
      .getElementById("close-instructions")
      .addEventListener("click", () => {
        this.hideInstructions();
      });

    // Close modal when clicking outside
    this.instructionsModal.addEventListener("click", (e) => {
      if (e.target === this.instructionsModal) {
        this.hideInstructions();
      }
    });

    // Reset game state when returning to menu
    this.onBackToMenu = null;
  }

  setBackToMenuHandler(handler) {
    this.onBackToMenu = handler;
  }

  showInstructions() {
    this.instructionsModal.classList.remove("hidden");
  }

  hideInstructions() {
    this.instructionsModal.classList.add("hidden");
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

    // Add event listener for back to menu button
    const backToMenuButton = document.getElementById("back-to-menu-button");
    const handleBackToMenu = () => {
      if (this.onBackToMenu) {
        this.onBackToMenu();
      }
      backToMenuButton.removeEventListener("click", handleBackToMenu);
    };
    backToMenuButton.addEventListener("click", handleBackToMenu);
  }
}
