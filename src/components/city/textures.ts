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

/** Dark ground with a faint engineering grid. */
export function createGroundTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#0d1420";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(148,163,184,0.06)";
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

/** Street surface: graphite with copper circuit traces and vias. */
export function createRoadTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512);
  ctx.fillStyle = "#131a26";
  ctx.fillRect(0, 0, 512, 512);

  // copper traces run along the street (x axis of the texture)
  const lanes = [80, 160, 256, 352, 432];
  ctx.strokeStyle = "rgba(217,119,6,0.55)";
  ctx.lineWidth = 4;
  for (const y of lanes) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    let x = 0;
    let cy = y;
    while (x < 512) {
      const seg = 60 + ((x * 7919 + y) % 80);
      x = Math.min(512, x + seg);
      ctx.lineTo(x, cy);
      if (x < 480 && (x + y) % 3 === 0) {
        const jog = ((x + y) % 2 === 0 ? 1 : -1) * 24;
        cy = Math.max(32, Math.min(480, cy + jog));
        ctx.lineTo(x + 24, cy);
        x += 24;
      }
    }
    ctx.stroke();
  }
  // vias
  for (let i = 0; i < 40; i++) {
    const x = (i * 977) % 512;
    const y = lanes[i % lanes.length];
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0d1420";
    ctx.fill();
    ctx.strokeStyle = "rgba(217,119,6,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // center dashed lane divider (electric blue)
  ctx.strokeStyle = "rgba(59,130,246,0.7)";
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
