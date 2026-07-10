import * as THREE from "three";

/**
 * Procedural canvas textures — no image assets to download.
 * Everything is generated once on the client and shared across meshes.
 */

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d")! };
}

/** Open ground beyond the streets/sidewalks: PCB solder-mask green. */
export function createGroundTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#123d27";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Street surface: plain asphalt with a dashed white center stripe. */
export function createRoadTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512);
  ctx.fillStyle = "#17191c";
  ctx.fillRect(0, 0, 512, 512);

  // faint asphalt grain
  ctx.strokeStyle = "rgba(255,255,255,0.02)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // dashed white center line
  ctx.strokeStyle = "rgba(245,245,245,0.9)";
  ctx.lineWidth = 5;
  ctx.setLineDash([28, 22]);
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow — used for the sun's halo sprite. */
export function createGlowTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128);
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,223,158,0.55)");
  grad.addColorStop(1, "rgba(255,223,158,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** Sidewalk: grey concrete slabs with expansion joints. */
export function createSidewalkTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128);
  ctx.fillStyle = "#7d848c";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Building facade: panel seams + a window grid.
 * Returns a diffuse map plus an emissive map (windows only) so window
 * glow can be dialed up at night via emissiveIntensity.
 */
export function createFacadeTextures(): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const size = 256;
  const wall = makeCanvas(size);
  const glow = makeCanvas(size);

  wall.ctx.fillStyle = "#0f1624";
  wall.ctx.fillRect(0, 0, size, size);
  glow.ctx.fillStyle = "#000000";
  glow.ctx.fillRect(0, 0, size, size);

  const cols = 4;
  const rows = 5;
  const cw = size / cols;
  const rh = size / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * cw + cw * 0.22;
      const y = r * rh + rh * 0.2;
      const w = cw * 0.56;
      const h = rh * 0.55;
      const lit = (c * 31 + r * 17) % 5 !== 0; // a few dark windows
      wall.ctx.fillStyle = lit ? "#243b55" : "#141c2b";
      wall.ctx.fillRect(x, y, w, h);
      glow.ctx.fillStyle = lit ? "#ffd9a0" : "#000000";
      glow.ctx.fillRect(x, y, w, h);
    }
  }
  // panel seams
  wall.ctx.strokeStyle = "rgba(148,163,184,0.15)";
  wall.ctx.lineWidth = 2;
  for (let c = 0; c <= cols; c++) {
    wall.ctx.beginPath();
    wall.ctx.moveTo(c * cw, 0);
    wall.ctx.lineTo(c * cw, size);
    wall.ctx.stroke();
  }

  const map = new THREE.CanvasTexture(wall.canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(glow.canvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}
