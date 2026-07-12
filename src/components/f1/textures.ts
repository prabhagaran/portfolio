import * as THREE from "three";

/**
 * F1-mode procedural textures. Shares the city's no-asset philosophy:
 * everything is drawn on a canvas once at load. The PCB-green ground and
 * LED banner generators are reused from the city's texture module.
 */

/**
 * Racing surface, mapped across the track ribbon: u (texture x) runs
 * across the track, v (texture y) tiles along it. White boundary lines
 * live at both x-edges; the center carries a faint copper "circuit
 * trace" dash — the engineering-identity nod from the spec.
 */
export function createTrackTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1b1e23";
  ctx.fillRect(0, 0, size, size);

  // faint asphalt grain
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // white track-limit lines at both edges
  ctx.fillStyle = "rgba(240,244,248,0.92)";
  ctx.fillRect(3, 0, 4, size);
  ctx.fillRect(size - 7, 0, 4, size);

  // copper trace center dash with solder-pad dots
  ctx.strokeStyle = "rgba(214,142,64,0.28)";
  ctx.lineWidth = 3;
  ctx.setLineDash([34, 30]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(214,142,64,0.3)";
  ctx.beginPath();
  ctx.arc(size / 2, size - 15, 4, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Start/finish checkerboard strip. */
export function createCheckerTexture(): THREE.CanvasTexture {
  const cell = 16;
  const cols = 10;
  const rows = 3;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = (c + r) % 2 === 0 ? "#f1f5f9" : "#0b0f14";
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
