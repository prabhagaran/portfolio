/**
 * Cursor trail: sparks flaring off a soldering iron, cooling from white-hot
 * to ember red as they fall and fade. Adapted from the canvas-particle
 * pattern in tholman/cursor-effects (bubbleCursor.js, MIT).
 */

interface SolderSparkOptions {
  element?: HTMLElement;
  zIndex?: string;
}

class Spark {
  initialLifeSpan: number;
  lifeSpan: number;
  velocity: { x: number; y: number };
  position: { x: number; y: number };
  prevPosition: { x: number; y: number };
  size: number;

  constructor(x: number, y: number) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.5;
    const lifeSpan = Math.floor(Math.random() * 18 + 14);
    this.initialLifeSpan = lifeSpan;
    this.lifeSpan = lifeSpan;
    this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 0.6 };
    this.position = { x, y };
    this.prevPosition = { x, y };
    this.size = 1.2 + Math.random() * 1.4;
  }

  update(context: CanvasRenderingContext2D) {
    this.velocity.y += 0.14; // gravity — sparks arc downward
    this.velocity.x *= 0.94; // drag
    this.velocity.y *= 0.97;

    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.lifeSpan--;

    const t = Math.max(this.lifeSpan / this.initialLifeSpan, 0); // 1 (born) -> 0 (dead)

    const r = 255;
    const g = Math.floor(20 + 235 * t);
    const b = Math.floor(180 * t * t);

    context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${t})`;
    context.lineWidth = Math.max(this.size * t, 0.4);
    context.beginPath();
    context.moveTo(this.prevPosition.x, this.prevPosition.y);
    context.lineTo(this.position.x, this.position.y);
    context.stroke();

    if (t > 0.55) {
      context.fillStyle = `rgba(255, 250, 220, ${(t - 0.55) * 1.5})`;
      context.beginPath();
      context.arc(this.position.x, this.position.y, this.size * 0.6, 0, Math.PI * 2);
      context.fill();
    }
  }
}

export function solderSpark(options?: SolderSparkOptions) {
  const hasWrapperEl = options?.element;
  const element = hasWrapperEl ?? document.body;

  let width = window.innerWidth;
  let height = window.innerHeight;
  const cursor = { x: width / 2, y: height / 2 };
  let sparks: Spark[] = [];
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let animationFrame: number;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function init() {
    if (prefersReducedMotion.matches) return false;

    canvas = document.createElement("canvas");
    context = canvas.getContext("2d")!;
    context.globalCompositeOperation = "lighter";

    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = options?.zIndex ?? "9999999999";

    if (hasWrapperEl) {
      canvas.style.position = "absolute";
      element.appendChild(canvas);
      canvas.width = element.clientWidth;
      canvas.height = element.clientHeight;
    } else {
      canvas.style.position = "fixed";
      document.body.appendChild(canvas);
      canvas.width = width;
      canvas.height = height;
    }

    bindEvents();
    loop();
  }

  function bindEvents() {
    element.addEventListener("mousemove", onMouseMove);
    element.addEventListener("touchmove", onTouchMove, { passive: true });
    element.addEventListener("touchstart", onTouchMove, { passive: true });
    window.addEventListener("resize", onWindowResize);
  }

  function onWindowResize() {
    width = window.innerWidth;
    height = window.innerHeight;

    if (hasWrapperEl) {
      canvas.width = element.clientWidth;
      canvas.height = element.clientHeight;
    } else {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function onTouchMove(e: TouchEvent) {
    for (let i = 0; i < e.touches.length; i++) {
      spawnSparks(e.touches[i].clientX, e.touches[i].clientY);
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (hasWrapperEl) {
      const boundingRect = element.getBoundingClientRect();
      cursor.x = e.clientX - boundingRect.left;
      cursor.y = e.clientY - boundingRect.top;
    } else {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    }
    spawnSparks(cursor.x, cursor.y);
  }

  function spawnSparks(x: number, y: number) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      sparks.push(new Spark(x, y));
    }
  }

  function updateSparks() {
    if (sparks.length === 0) return;

    context.clearRect(0, 0, width, height);

    for (const spark of sparks) {
      spark.update(context);
    }

    sparks = sparks.filter((s) => s.lifeSpan >= 0);

    if (sparks.length === 0) {
      context.clearRect(0, 0, width, height);
    }
  }

  function loop() {
    updateSparks();
    animationFrame = requestAnimationFrame(loop);
  }

  function destroy() {
    canvas?.remove();
    cancelAnimationFrame(animationFrame);
    element.removeEventListener("mousemove", onMouseMove);
    element.removeEventListener("touchmove", onTouchMove);
    element.removeEventListener("touchstart", onTouchMove);
    window.removeEventListener("resize", onWindowResize);
  }

  init();

  return { destroy };
}
