// Keyboard and mouse input manager for on-foot combat, driving, and quick hotkeys.

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouseScreen = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
    this.mouseWorld = { x: 0, y: 0 };
    this.mouseDown = false;
    this.mouseJustPressed = false;
    this.wheelDelta = 0;

    this._onKeyDown = (e) => {
      const code = e.code;
      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
      }
      this.keys.add(code);
    };

    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      this.mouseScreen.x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseScreen.y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    };

    this._onMouseDown = (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.mouseJustPressed = true;
      }
    };

    this._onMouseUp = (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
      }
    };

    this._onWheel = (e) => {
      this.wheelDelta += Math.sign(e.deltaY);
    };

    this._onBlur = () => {
      this.keys.clear();
      this.justPressed.clear();
      this.mouseDown = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('wheel', this._onWheel, { passive: true });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.justPressed.has(code);
  }

  getMoveVector() {
    let dx = 0;
    let dy = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx += 1;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    return { x: dx, y: dy };
  }

  getDriveControls() {
    const throttle =
      (this.isDown('KeyW') || this.isDown('ArrowUp') ? 1 : 0) -
      (this.isDown('KeyS') || this.isDown('ArrowDown') ? 1 : 0);
    const steer =
      (this.isDown('KeyD') || this.isDown('ArrowRight') ? 1 : 0) -
      (this.isDown('KeyA') || this.isDown('ArrowLeft') ? 1 : 0);
    const handbrake = this.isDown('Space');
    return { throttle, steer, handbrake };
  }

  updateMouseWorld(camera, canvasWidth, canvasHeight) {
    this.mouseWorld.x = camera.x + (this.mouseScreen.x - canvasWidth * 0.5) / camera.zoom;
    this.mouseWorld.y = camera.y + (this.mouseScreen.y - canvasHeight * 0.5) / camera.zoom;
  }

  endFrame() {
    this.justPressed.clear();
    this.mouseJustPressed = false;
    this.wheelDelta = 0;
  }
}
