/*
 * THE VEILING & THE LIGHT
 * A Quranic perspective on substances — alcohol, cannabis, nicotine
 *
 * Alcohol & Cannabis: khamr (veil the intellect) — "from Shaytan's work" (5:90)
 * Nicotine: destroys the body — "do not throw yourselves into destruction" (2:195)
 */

// ── Color palette (HSB) ──
const HUE_GOLD     = 45;
const HUE_ALCOHOL  = 0;     // deep red-crimson
const HUE_CANNABIS = 280;   // dark purple
const HUE_NICOTINE = 80;    // toxic yellow-green
const BG_HUE       = 230;   // deep dark blue

// ── Particle pools ──
let alcoholSmoke  = [];
let cannabisSmoke = [];
let nicotineBarbs = [];

const ALCOHOL_COUNT  = 120;
const CANNABIS_COUNT = 100;
const NICOTINE_COUNT = 60;

// ── Animation state ──
let breathPhase = 0;

// ── Zone angles (radians) ──
const ALCOHOL_ANGLE  = PI * 7 / 6;   // lower-left
const CANNABIS_ANGLE = PI * 11 / 6;  // lower-right
const NICOTINE_ANGLE = PI * 3 / 2;   // top

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');

  for (let i = 0; i < ALCOHOL_COUNT; i++)
    alcoholSmoke.push(createSmoke(ALCOHOL_ANGLE));
  for (let i = 0; i < CANNABIS_COUNT; i++)
    cannabisSmoke.push(createSmoke(CANNABIS_ANGLE));
  for (let i = 0; i < NICOTINE_COUNT; i++)
    nicotineBarbs.push(createBarb());
}

// ─────────────────────────────────────────────
// DRAW
// ─────────────────────────────────────────────
function draw() {
  background(BG_HUE, 60, 5, 15);

  let t = frameCount * 0.01;
  breathPhase = (sin(t * 0.8) + 1) / 2; // 0..1

  push();
  translate(width / 2, height / 2);

  drawRosette(t);
  drawSubstanceZones(t);
  updateSmoke(alcoholSmoke, HUE_ALCOHOL, ALCOHOL_ANGLE, 0.4, t);
  updateSmoke(cannabisSmoke, HUE_CANNABIS, CANNABIS_ANGLE, 0.6, t);
  updateBarbs(t);
  drawVeilOverlay();

  pop();

  drawQuranText(t);
}

// ─────────────────────────────────────────────
// ISLAMIC GEOMETRIC ROSETTE (12-fold)
// ─────────────────────────────────────────────
function drawRosette(t) {
  let R = min(width, height) * 0.22;
  let foldCount = 12;
  let pulseR = R * (1 + 0.03 * sin(t * 2));
  let clarity = lerp(0.4, 1.0, breathPhase);

  push();
  rotate(t * 0.05);

  // Layer 1: Outer ring
  noFill();
  stroke(HUE_GOLD, 60, 100 * clarity, 80 * clarity);
  strokeWeight(1.5);
  circle(0, 0, pulseR * 2);

  // Layer 2: 12-fold kite petals
  for (let i = 0; i < foldCount; i++) {
    let angle = i * TWO_PI / foldCount;
    push();
    rotate(angle);

    let innerR = pulseR * 0.35;
    let outerR = pulseR * 0.95;
    let halfSector = PI / foldCount;

    stroke(HUE_GOLD, 50, 95 * clarity, 70 * clarity);
    strokeWeight(1);
    noFill();

    beginShape();
    vertex(0, -innerR);
    vertex(sin(halfSector) * outerR, -cos(halfSector) * outerR);
    vertex(0, -outerR * 1.05);
    vertex(-sin(halfSector) * outerR, -cos(halfSector) * outerR);
    endShape(CLOSE);

    pop();
  }

  // Layer 3: Inner 12-pointed star (two overlapping hexagons)
  stroke(HUE_GOLD, 70, 100 * clarity, 60 * clarity);
  strokeWeight(0.8);
  noFill();
  let starR = pulseR * 0.6;
  for (let offset = 0; offset < 2; offset++) {
    beginShape();
    for (let i = 0; i < 6; i++) {
      let a = i * TWO_PI / 6 + offset * PI / 6;
      vertex(cos(a) * starR, sin(a) * starR);
    }
    endShape(CLOSE);
  }

  // Layer 4: Central luminous glow (the "nur")
  noStroke();
  for (let g = 3; g > 0; g--) {
    fill(HUE_GOLD, 40, 100 * clarity, 15 * clarity * g / 3);
    circle(0, 0, pulseR * 0.15 * g * 2);
  }

  // Layer 5: Radial lattice lines
  stroke(HUE_GOLD, 30, 80 * clarity, 40 * clarity);
  strokeWeight(0.5);
  for (let i = 0; i < foldCount; i++) {
    let a = i * TWO_PI / foldCount;
    line(0, 0, cos(a) * pulseR * 0.9, sin(a) * pulseR * 0.9);
  }

  // Layer 6: Second petal ring (half-sector offset) for interlocking depth
  for (let i = 0; i < foldCount; i++) {
    let angle = (i + 0.5) * TWO_PI / foldCount;
    push();
    rotate(angle);

    let innerR2 = pulseR * 0.45;
    let outerR2 = pulseR * 0.78;
    let halfSector = PI / foldCount;

    stroke(HUE_GOLD, 40, 85 * clarity, 45 * clarity);
    strokeWeight(0.7);
    noFill();

    beginShape();
    vertex(0, -innerR2);
    vertex(sin(halfSector * 0.7) * outerR2, -cos(halfSector * 0.7) * outerR2);
    vertex(0, -outerR2 * 1.02);
    vertex(-sin(halfSector * 0.7) * outerR2, -cos(halfSector * 0.7) * outerR2);
    endShape(CLOSE);

    pop();
  }

  pop();
}

// ─────────────────────────────────────────────
// SUBSTANCE ZONES (background glows)
// ─────────────────────────────────────────────
function drawSubstanceZones(t) {
  let zoneDist = min(width, height) * 0.35;
  drawZoneGlow(ALCOHOL_ANGLE, zoneDist, HUE_ALCOHOL, 'ALCOHOL', t);
  drawZoneGlow(CANNABIS_ANGLE, zoneDist, HUE_CANNABIS, 'CANNABIS', t);
  drawZoneGlow(NICOTINE_ANGLE, zoneDist, HUE_NICOTINE, 'NICOTINE', t);
}

function drawZoneGlow(angle, dist, hue, label, t) {
  let cx = cos(angle) * dist;
  let cy = sin(angle) * dist;
  let pulseSize = 60 + sin(t * 1.5) * 10;

  noStroke();
  for (let r = 3; r > 0; r--) {
    fill(hue, 70, 40, 8 * r);
    circle(cx, cy, pulseSize * r);
  }

  // Zone marker
  stroke(hue, 60, 70, 50);
  strokeWeight(0.8);
  noFill();
  circle(cx, cy, 20);

  // Label
  fill(hue, 50, 80, 70);
  noStroke();
  textSize(10);
  textAlign(CENTER, CENTER);
  text(label, cx, cy + pulseSize * 0.6);
}

// ─────────────────────────────────────────────
// SMOKE PARTICLES (alcohol & cannabis — khamr)
// ─────────────────────────────────────────────
function createSmoke(zoneAngle) {
  let spawnDist = min(width || 800, height || 600) * 0.35;
  let spread = 0.3;
  let a = zoneAngle + random(-spread, spread);
  let d = spawnDist + random(-30, 30);
  return {
    x: cos(a) * d,
    y: sin(a) * d,
    vx: 0,
    vy: 0,
    life: random(0.5, 1),
    maxLife: random(120, 300),
    size: random(15, 45)
  };
}

function updateSmoke(particles, hue, zoneAngle, noiseInfluence, t) {
  for (let p of particles) {
    let toCenter = atan2(-p.y, -p.x);
    let noiseAngle = noise(p.x * 0.005, p.y * 0.005, t * 0.3) * TWO_PI;
    let driftAngle = lerp(toCenter, noiseAngle, noiseInfluence);

    p.vx += cos(driftAngle) * 0.15;
    p.vy += sin(driftAngle) * 0.15;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.x += p.vx;
    p.y += p.vy;

    p.life -= 1 / p.maxLife;

    let alpha = p.life * 30 * (1 - breathPhase * 0.5);
    noStroke();
    fill(hue, 60, 20, alpha);
    ellipse(p.x, p.y, p.size * (1 + (1 - p.life) * 0.5), p.size * (1 + (1 - p.life) * 0.3));

    if (p.life <= 0) {
      Object.assign(p, createSmoke(zoneAngle));
    }
  }
}

// ─────────────────────────────────────────────
// NICOTINE BARBS (bodily harm — not veiling)
// ─────────────────────────────────────────────
function createBarb() {
  let spawnDist = min(width || 800, height || 600) * 0.35;
  let spread = 0.4;
  let a = NICOTINE_ANGLE + random(-spread, spread);
  let d = spawnDist + random(-20, 20);
  return {
    x: cos(a) * d,
    y: sin(a) * d,
    vx: 0,
    vy: 0,
    life: 1,
    maxLife: random(80, 200),
    hasHit: false,
    hitLife: 30
  };
}

function updateBarbs(t) {
  let R = min(width, height) * 0.22;

  for (let p of nicotineBarbs) {
    if (!p.hasHit) {
      let toCenter = atan2(-p.y, -p.x);
      p.vx = cos(toCenter) * 2.5;
      p.vy = sin(toCenter) * 2.5;
      p.x += p.vx;
      p.y += p.vy;

      // Draw thorn-like line
      stroke(HUE_NICOTINE, 80, 90, 70 * p.life);
      strokeWeight(1.5);
      let len = 8;
      line(p.x, p.y, p.x - cos(toCenter) * len, p.y - sin(toCenter) * len);

      // Collision with rosette boundary
      if (dist(p.x, p.y, 0, 0) < R * 1.05) {
        p.hasHit = true;
        p.hitLife = 30;
        p.life = 1;
      }
    } else {
      p.life -= 1 / p.hitLife;

      // Impact sparks
      stroke(HUE_NICOTINE, 90, 100, 60 * p.life);
      strokeWeight(0.5);
      for (let s = 0; s < 3; s++) {
        let sa = random(TWO_PI);
        let sl = random(3, 10) * p.life;
        line(p.x, p.y, p.x + cos(sa) * sl, p.y + sin(sa) * sl);
      }

      // Erosion mark
      noStroke();
      fill(0, 0, 0, 20 * p.life);
      circle(p.x, p.y, 6);
    }

    if (!p.hasHit) p.life -= 1 / p.maxLife;

    if (p.life <= 0) {
      Object.assign(p, createBarb());
    }
  }
}

// ─────────────────────────────────────────────
// VEIL OVERLAY (khamr darkening effect)
// ─────────────────────────────────────────────
function drawVeilOverlay() {
  let R = min(width, height) * 0.25;

  let nearCount = 0;
  let allSmoke = alcoholSmoke.concat(cannabisSmoke);
  for (let p of allSmoke) {
    if (p.x * p.x + p.y * p.y < R * R * 1.44) nearCount++;
  }

  let veilAlpha = map(nearCount, 0, 80, 0, 25);
  veilAlpha *= (1 - breathPhase * 0.6);

  noStroke();
  fill(0, 0, 0, veilAlpha);
  circle(0, 0, R * 2.5);
}

// ─────────────────────────────────────────────
// QURANIC TEXT
// ─────────────────────────────────────────────
function drawQuranText(t) {
  let pulse = (sin(t * 0.5) + 1) / 2;
  let R = min(width, height);

  textAlign(CENTER, CENTER);

  // Title
  fill(HUE_GOLD, 50, 100, 70);
  textSize(16);
  text('THE VEILING & THE LIGHT', width / 2, 30);

  fill(0, 0, 70, 50);
  textSize(10);
  text('A Quranic perspective on substances that harm mind and body', width / 2, 52);

  // Central verse — 5:90 (about khamr / Shaytan)
  let verseY = height / 2 + R * 0.28;
  fill(HUE_GOLD, 40, 90, 60 + pulse * 20);
  textSize(11);
  text('"...intoxicants are but defilement', width / 2, verseY);
  text('from the work of Shaytan..."', width / 2, verseY + 16);
  fill(HUE_GOLD, 30, 70, 50);
  textSize(9);
  text('\u2014 Al-Ma\'idah 5:90', width / 2, verseY + 36);

  // Nicotine verse — 2:195 (self-destruction)
  let nicY = height / 2 + sin(NICOTINE_ANGLE) * R * 0.35;
  fill(HUE_NICOTINE, 40, 80, 50 + pulse * 15);
  textSize(10);
  text('"Do not throw yourselves into destruction"', width / 2, nicY - 50);
  fill(HUE_NICOTINE, 30, 60, 40);
  textSize(9);
  text('\u2014 Al-Baqarah 2:195', width / 2, nicY - 34);

  // Category labels
  fill(0, 0, 60, 40);
  textSize(8);

  let alcX = width / 2 + cos(ALCOHOL_ANGLE) * R * 0.35;
  let alcY = height / 2 + sin(ALCOHOL_ANGLE) * R * 0.35;
  text('KHAMR \u2014 veils the intellect', alcX, alcY + 55);

  let canX = width / 2 + cos(CANNABIS_ANGLE) * R * 0.35;
  let canY = height / 2 + sin(CANNABIS_ANGLE) * R * 0.35;
  text('KHAMR by qiyas (analogy)', canX, canY + 55);

  text('Harms the body \u2014 self-destruction', width / 2, nicY + 65);
}

// ─────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
