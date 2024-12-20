import { Game } from "./game/Game.js";

window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();

  // Setup menu buttons
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");

  startButton.addEventListener("click", () => {
    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("game-ui").classList.remove("hidden");
    game.start();
  });

  restartButton.addEventListener("click", () => {
    document.getElementById("game-over").classList.add("hidden");
    document.getElementById("game-ui").classList.remove("hidden");
    game.restart();
  });
});
