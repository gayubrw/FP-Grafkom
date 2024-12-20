export class Controls {
  constructor(player) {
    this.player = player;
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
      ArrowUp: false  
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        this.keys[e.code] = true;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        e.preventDefault();
        this.keys[e.code] = false;
      }
    });
  }

  update() {
    if (this.keys.ArrowLeft) {
      this.player.moveLeft();
    }
    if (this.keys.ArrowRight) {
      this.player.moveRight();
    }
    if (this.keys.Space || this.keys.ArrowUp) {  
      this.player.jump();
    }
  }
}