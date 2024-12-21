export class ScoreManager {
  constructor() {
    this.distanceTraveled = 0;
    this.score = 0;
    this.highScores = JSON.parse(localStorage.getItem("highScores")) || [
      { name: "---", score: 0 },
      { name: "---", score: 0 },
    ];
    this.scoreElement = document.getElementById("score");
    this.highScoreElement = document.getElementById("high-score");
    this.updateDisplay();
    this.updateHighScoresList();
  }

  updateDistance(distance) {
    this.distanceTraveled = distance;
    this.score = Math.floor(Math.abs(this.distanceTraveled));
    this.updateDisplay();
  }

  resetScore() {
    this.distanceTraveled = 0;
    this.score = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    this.scoreElement.textContent = `Distance: ${this.score}m`;
    this.highScoreElement.textContent = `Best: ${Math.max(
      ...this.highScores.map((hs) => hs.score)
    )}m`;
  }

  updateHighScoresList() {
    const scoreEntries = document.querySelectorAll(".score-entry");
    this.highScores.sort((a, b) => b.score - a.score);

    scoreEntries.forEach((entry, index) => {
      if (this.highScores[index] !== undefined) {
        const score = this.highScores[index].score;
        if (score > 0) {
          entry.textContent = `${
            this.highScores[index].name
          } - ${this.highScores[index].score.toLocaleString()}`;
        } else {
          entry.textContent = "---";
        }
      }
    });
  }

  async checkAndUpdateHighScores() {
    const lowestHighScore = this.highScores[1].score;
    if (this.score > lowestHighScore) {
      const name = await this.promptForName();
      if (name) {
        this.highScores.push({ name: name.toUpperCase(), score: this.score });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 2); // Keep only top 2
        localStorage.setItem("highScores", JSON.stringify(this.highScores));
        this.updateHighScoresList();
        return true;
      }
    }
    return false;
  }

  async promptForName() {
    // Create modal for name input
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content high-score-input">
        <h2>New High Score!</h2>
        <p>Your score: ${this.score}</p>
        <div class="name-input-container">
          <input type="text" id="playerName" maxlength="3" placeholder="Enter 3 letters" 
                 class="name-input" autocomplete="off">
        </div>
        <button id="submitName" class="menu-button primary">Submit</button>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector("#playerName");
    const submitButton = modal.querySelector("#submitName");
    input.focus();

    // Force uppercase and limit to 3 letters
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
      if (e.target.value.length > 3) {
        e.target.value = e.target.value.slice(0, 3);
      }
    });

    return new Promise((resolve) => {
      submitButton.addEventListener("click", () => {
        const name = input.value.trim();
        if (name) {
          document.body.removeChild(modal);
          resolve(name);
        }
      });

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          document.body.removeChild(modal);
          resolve(input.value.trim());
        }
      });
    });
  }

  getScore() {
    return this.score;
  }
}
