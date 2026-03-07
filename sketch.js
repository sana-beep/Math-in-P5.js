// p5.js: 16 math panels — organic motion, draggable info + control cards

let pts, chain;
const PANEL_COLS = 5;

let fourierPad = {
  drawing: false,
  points: [],
  samples: [],
  coeffs: [],
  path: [],
  time: 0,
};

// ── Window state ──────────────────────────────────────────────────────────────
let infoWin = { open: false, panel: 0, x: 60, y: 60, drag: false, ox: 0, oy: 0 };
let ctrlWin = { open: false, panel: 0, x: 120, y: 80, drag: false, ox: 0, oy: 0, knob: null };
let topCard = 'ctrl'; // which card renders last (on top)

// Layout constants
const IW = 490;                         // info card width
const IH = 360;                         // info card height
const CW = 372;                         // ctrl card width
const HDR = 38;                         // header height
const KR = 15;                          // knob radius
const KCOLS = 4;                        // knobs per row
const KCW = (CW - 32) / KCOLS;         // knob cell width
const KCH = 74;                         // knob cell height
const KY = HDR + 50;                    // y-offset inside ctrl card where knobs start

const KNOB_SA = 2 * Math.PI / 3;       // start angle: 7-o'clock (120°)
const KNOB_SW = 5 * Math.PI / 3;       // sweep: 300°

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');
  noFill(); strokeWeight(1);

  pts   = Array.from({ length: 200 }, () => ({ x: random(-1, 1), y: random(-1, 1) }));
  chain = Array.from({ length: 60  }, () => ({ x: 0, y: 0 }));

  infoWin.x = width / 2 - IW / 2;
  infoWin.y = height / 2 - IH / 2;
  ctrlWin.x = width / 2 - CW / 2;
  ctrlWin.y = 60;
}

function draw() {
  background(0, 0, 0, 20);
  let t = frameCount * 0.015;
  let pw = width / PANEL_COLS, ph = height / ceil(PANELS.length / PANEL_COLS);

  for (let i = 0; i < PANELS.length; i++) {
    let px = (i % PANEL_COLS) * pw, py = floor(i / PANEL_COLS) * ph;
    drawPanel(PANELS[i], i, px, py, pw, ph, t);
  }

  // Draw cards in z-order (top card last)
  let order = topCard === 'info' ? ['ctrl', 'info'] : ['info', 'ctrl'];
  for (let w of order) {
    if (w === 'info' && infoWin.open) drawInfoCard();
    if (w === 'ctrl' && ctrlWin.open) drawCtrlCard();
  }

  // Cursor
  let hot = false;
  for (let i = 0; i < PANELS.length; i++) {
    let px = (i % PANEL_COLS) * pw, py = floor(i / PANEL_COLS) * ph;
    if (dist(mouseX, mouseY, px + pw - 22, py + 16) < 12 ||
        dist(mouseX, mouseY, px + pw - 44, py + 16) < 12) { hot = true; break; }
  }
  if (!hot && ctrlWin.open) {
    for (let k of getKnobs()) { if (dist(mouseX, mouseY, k.x, k.y) < KR + 6) { hot = true; break; } }
  }
  cursor((hot || ctrlWin.knob || infoWin.drag || ctrlWin.drag) ? HAND : ARROW);
}

// ── Panel renderer ─────────────────────────────────────────────────────────────
function drawPanel(p, idx, px, py, pw, ph, t) {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(px, py, pw, ph);
  drawingContext.clip();

  push();
  translate(px + pw / 2, py + ph / 2);
  noFill(); strokeWeight(1); stroke(p.h, 80, 100);
  p.draw(pw, ph, t);

  strokeWeight(0.5); stroke(p.h, 40, 70, 50);
  rect(-pw / 2, -ph / 2, pw, ph);

  noStroke(); fill(p.h, 30, 100);
  textSize(9); textAlign(LEFT, TOP);
  text(p.title, -pw / 2 + 8, -ph / 2 + 7);

  // "?" info button
  panelBtn(pw / 2 - 22, -ph / 2 + 16, '?', p.h,
           dist(mouseX, mouseY, px + pw - 22, py + 16) < 12);

  // "⚙" ctrl button
  panelBtn(pw / 2 - 44, -ph / 2 + 16, '\u2699', p.h,
           dist(mouseX, mouseY, px + pw - 44, py + 16) < 12);

  pop();
  drawingContext.restore();
}

function panelBtn(bx, by, label, h, hot) {
  fill(0, 0, hot ? 30 : 8, hot ? 90 : 70);
  stroke(h, 55, hot ? 100 : 65); strokeWeight(0.8);
  circle(bx, by, 18);
  noStroke(); fill(h, 20, 100);
  textSize(10); textAlign(CENTER, CENTER);
  text(label, bx, by);
}

// ── Info card ──────────────────────────────────────────────────────────────────
function drawInfoCard() {
  let { x, y, panel } = infoWin;
  let p = PANELS[panel];

  fill(0, 0, 7); stroke(p.h, 55, 100); strokeWeight(1);
  rect(x, y, IW, IH, 6);

  noStroke(); fill(p.h, 70, 90, 35);
  rect(x, y, IW, HDR, 6, 6, 0, 0);

  fill(p.h, 55, 100); textSize(14); textAlign(LEFT, CENTER);
  text(p.title, x + 16, y + HDR / 2);
  closeBtn(x + IW - 22, y + HDR / 2);

  // Equation box
  let eqY = y + HDR + 10;
  fill(0, 0, 12); stroke(p.h, 35, 60, 55); strokeWeight(0.5);
  rect(x + 14, eqY, IW - 28, 44, 4);
  noStroke(); fill(p.h, 45, 100); textSize(12); textAlign(LEFT, TOP);
  text(p.eq, x + 24, eqY + 10, IW - 48, 34);

  fill(0, 0, 82); textSize(11); textAlign(LEFT, TOP);
  text(p.desc, x + 16, eqY + 58, IW - 32, IH - HDR - 78);
}

// ── Control card ───────────────────────────────────────────────────────────────
function drawCtrlCard() {
  let { x, y, panel } = ctrlWin;
  let p  = PANELS[panel];
  let ch = ctrlCardH(panel);

  fill(0, 0, 7); stroke(p.h, 55, 100); strokeWeight(1);
  rect(x, y, CW, ch, 6);

  noStroke(); fill(p.h, 70, 90, 35);
  rect(x, y, CW, HDR, 6, 6, 0, 0);

  fill(p.h, 55, 100); textSize(14); textAlign(LEFT, CENTER);
  text(p.title, x + 16, y + HDR / 2);
  closeBtn(x + CW - 22, y + HDR / 2);

  noStroke(); fill(p.h, 40, 85); textSize(10); textAlign(LEFT, TOP);
  text(p.eq, x + 14, y + HDR + 8, CW - 28, 36);

  stroke(p.h, 25, 45, 50); strokeWeight(0.5);
  line(x + 14, y + HDR + 46, x + CW - 14, y + HDR + 46);

  for (let k of getKnobs()) drawKnob(k.x, k.y, k.pm, p.h);
}

function closeBtn(cx, cy) {
  let hot = dist(mouseX, mouseY, cx, cy) < 12;
  fill(0, 0, hot ? 35 : 10, 85); stroke(0, 0, 70); strokeWeight(0.5);
  circle(cx, cy, 20);
  noStroke(); fill(0, 0, 85); textSize(13); textAlign(CENTER, CENTER);
  text('\u00d7', cx, cy);
}

function drawKnob(x, y, pm, h) {
  let t   = map(pm.value, pm.min, pm.max, 0, 1);
  let cur = KNOB_SA + t * KNOB_SW;
  let active = ctrlWin.knob && ctrlWin.knob.pm === pm;
  let hot    = dist(mouseX, mouseY, x, y) < KR + 6;

  noFill(); stroke(h, 20, 35); strokeWeight(2.5);
  arc(x, y, KR * 2, KR * 2, KNOB_SA, KNOB_SA + KNOB_SW);

  stroke(h, active ? 100 : 75, 100); strokeWeight(2.5);
  if (t > 0.001) arc(x, y, KR * 2, KR * 2, KNOB_SA, cur);

  fill(0, 0, active ? 25 : hot ? 15 : 8); noStroke();
  circle(x, y, KR * 1.5);

  fill(h, 90, 100); noStroke();
  circle(x + cos(cur) * KR * 0.72, y + sin(cur) * KR * 0.72, 4);

  fill(0, 0, 60); textSize(8); textAlign(CENTER, TOP);
  text(pm.label, x, y + KR + 3);
  fill(h, 45, 100); textSize(8);
  text(nf(pm.value, 1, 2), x, y + KR + 13);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getKnobs() {
  let p    = PANELS[ctrlWin.panel];
  let keys = Object.keys(p.params);
  return keys.map((key, i) => ({
    key, pm: p.params[key],
    x: ctrlWin.x + 16 + (i % KCOLS) * KCW + KCW / 2,
    y: ctrlWin.y + KY + floor(i / KCOLS) * KCH + KR + 8,
  }));
}

function ctrlCardH(idx) {
  let rows = ceil(Object.keys(PANELS[idx].params).length / KCOLS);
  return KY + rows * KCH + 16;
}

function addFourierPoint(mx, my, px, py, pw, ph) {
  let x = constrain(mx - (px + pw / 2), -pw / 2 + 8, pw / 2 - 8);
  let y = constrain(my - (py + ph / 2), -ph / 2 + 8, ph / 2 - 8);
  let prev = fourierPad.points[fourierPad.points.length - 1];
  if (!prev || dist(x, y, prev.x, prev.y) > 2) {
    fourierPad.points.push({ x, y });
  }
}

function buildFourierFromStroke() {
  if (fourierPad.points.length < 8) return;
  fourierPad.samples = resamplePath(fourierPad.points, 256);
  fourierPad.coeffs = dftComplex(fourierPad.samples)
    .sort((a, b) => b.amp - a.amp);
  fourierPad.path = [];
  fourierPad.time = 0;
}

function resamplePath(points, count) {
  let out = [];
  let n = points.length;
  for (let i = 0; i < count; i++) {
    let pos = i / count * n;
    let i0 = floor(pos) % n;
    let i1 = (i0 + 1) % n;
    let f = pos - floor(pos);
    out.push({
      x: lerp(points[i0].x, points[i1].x, f),
      y: lerp(points[i0].y, points[i1].y, f),
    });
  }
  return out;
}

function dftComplex(samples) {
  let X = [];
  let N = samples.length;
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      let phi = TWO_PI * k * n / N;
      re += samples[n].x * cos(phi) + samples[n].y * sin(phi);
      im += samples[n].y * cos(phi) - samples[n].x * sin(phi);
    }
    re /= N;
    im /= N;
    let freq = (k <= N / 2) ? k : k - N;
    X.push({ re, im, freq, amp: sqrt(re * re + im * im), phase: atan2(im, re) });
  }
  return X;
}

function drawEpicycles(x, y, rotation, coeffs, termCount, time, hue) {
  for (let i = 0; i < min(termCount, coeffs.length); i++) {
    let c = coeffs[i];
    let prevx = x, prevy = y;
    let ang = c.freq * time + c.phase + rotation;
    x += c.amp * cos(ang);
    y += c.amp * sin(ang);
    stroke(hue, 20, 90, 30);
    circle(prevx, prevy, c.amp * 2);
    stroke(hue, 70, 100, 55);
    line(prevx, prevy, x, y);
  }
  return { x, y };
}

// ── Mouse events ───────────────────────────────────────────────────────────────
function mousePressed() {
  let pw = width / PANEL_COLS, ph = height / ceil(PANELS.length / PANEL_COLS);
  let cards = topCard === 'ctrl'
    ? [['ctrl', ctrlWin, CW, ctrlCardH(ctrlWin.panel)],
       ['info', infoWin, IW, IH]]
    : [['info', infoWin, IW, IH],
       ['ctrl', ctrlWin, CW, ctrlCardH(ctrlWin.panel)]];

  for (let [name, win, w, h] of cards) {
    if (!win.open) continue;
    let { x, y } = win;

    // Close button
    let cx = x + w - 22, cy = y + HDR / 2;
    if (dist(mouseX, mouseY, cx, cy) < 12) { win.open = false; return; }

    // Header drag
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + HDR) {
      win.drag = true; win.ox = mouseX - x; win.oy = mouseY - y;
      topCard = name; return;
    }

    // Knobs (ctrl only)
    if (name === 'ctrl') {
      for (let k of getKnobs()) {
        if (dist(mouseX, mouseY, k.x, k.y) < KR + 6) {
          ctrlWin.knob = { pm: k.pm, startY: mouseY, startVal: k.pm.value };
          topCard = 'ctrl'; return;
        }
      }
    }

    // Click inside card → bring to front, absorb
    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      topCard = name; return;
    }
  }

  // Panel buttons
  for (let i = 0; i < PANELS.length; i++) {
    let px = (i % PANEL_COLS) * pw, py = floor(i / PANEL_COLS) * ph;

    if (dist(mouseX, mouseY, px + pw - 22, py + 16) < 12) {
      infoWin.panel = i; infoWin.open = true; topCard = 'info';
      infoWin.x = constrain(px + pw / 2 - IW / 2, 0, width  - IW);
      infoWin.y = constrain(py + ph / 2 - IH / 2, 0, height - IH);
      return;
    }
    if (dist(mouseX, mouseY, px + pw - 44, py + 16) < 12) {
      ctrlWin.panel = i; ctrlWin.open = true; topCard = 'ctrl';
      let ch = ctrlCardH(i);
      ctrlWin.x = constrain(px + pw / 2 - CW / 2, 0, width  - CW);
      ctrlWin.y = constrain(py + ph / 2 - ch / 2,  0, height - ch);
      return;
    }
  }

  let drawPanelIdx = PANELS.length - 1;
  let drawPx = (drawPanelIdx % PANEL_COLS) * pw;
  let drawPy = floor(drawPanelIdx / PANEL_COLS) * ph;
  let inDrawPanel = mouseX > drawPx && mouseX < drawPx + pw && mouseY > drawPy && mouseY < drawPy + ph;
  let onButtons = dist(mouseX, mouseY, drawPx + pw - 22, drawPy + 16) < 12 ||
                  dist(mouseX, mouseY, drawPx + pw - 44, drawPy + 16) < 12;

  if (inDrawPanel && !onButtons) {
    fourierPad.drawing = true;
    fourierPad.points = [];
    fourierPad.samples = [];
    fourierPad.coeffs = [];
    fourierPad.path = [];
    fourierPad.time = 0;
    addFourierPoint(mouseX, mouseY, drawPx, drawPy, pw, ph);
  }
}

function mouseDragged() {
  if (infoWin.drag) {
    infoWin.x = constrain(mouseX - infoWin.ox, 0, width  - IW);
    infoWin.y = constrain(mouseY - infoWin.oy, 0, height - IH);
  }
  if (ctrlWin.drag) {
    let ch = ctrlCardH(ctrlWin.panel);
    ctrlWin.x = constrain(mouseX - ctrlWin.ox, 0, width  - CW);
    ctrlWin.y = constrain(mouseY - ctrlWin.oy, 0, height - ch);
  }
  if (ctrlWin.knob) {
    let k = ctrlWin.knob;
    let delta = (k.startY - mouseY) / 120;
    k.pm.value = constrain(k.startVal + delta * (k.pm.max - k.pm.min), k.pm.min, k.pm.max);
  }

  if (fourierPad.drawing) {
    let pw = width / PANEL_COLS, ph = height / ceil(PANELS.length / PANEL_COLS);
    let drawPanelIdx = PANELS.length - 1;
    let drawPx = (drawPanelIdx % PANEL_COLS) * pw;
    let drawPy = floor(drawPanelIdx / PANEL_COLS) * ph;
    addFourierPoint(mouseX, mouseY, drawPx, drawPy, pw, ph);
  }
}

function mouseReleased() {
  infoWin.drag = false;
  ctrlWin.drag = false;
  ctrlWin.knob = null;
  if (fourierPad.drawing) {
    fourierPad.drawing = false;
    buildFourierFromStroke();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ── Panel definitions ──────────────────────────────────────────────────────────
// draw(w, h, t): use `this.params.key.value` to read live param values

const PANELS = [

  { title: 'SIN · COS', h: 0,
    eq: 'x = sin(A\u00b7\u03b8 + t),  y = cos(B\u00b7\u03b8 + C\u00b7t)',
    desc: 'Two oscillators at different frequencies A and B drive x and y independently. When the ratio A/B is irrational the curve never closes, slowly tracing new paths. Lissajous figures appear on oscilloscopes when two signals are compared in quadrature.',
    params: {
      freqA:  { value: 3,   min: 1,   max: 12,  label: 'Freq A'  },
      freqB:  { value: 5,   min: 1,   max: 12,  label: 'Freq B'  },
      phaseC: { value: 0.3, min: 0,   max: 3,   label: 'Phase C' },
      loops:  { value: 20,  min: 2,   max: 60,  label: 'Loops'   },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      beginShape();
      for (let i = 0; i < TWO_PI * pm.loops.value; i += 0.02)
        vertex(r * sin(pm.freqA.value * i + t), r * cos(pm.freqB.value * i + t * pm.phaseC.value));
      endShape();
    },
  },

  { title: 'NOISE', h: 22,
    eq: 'angle = noise(x\u00b7S, y\u00b7S, t\u00b7T) \u00d7 A\u00b72\u03c0',
    desc: 'Each particle queries a 3D Perlin noise field at its position to get a steering angle. Perlin noise is smooth and continuous — nearby particles receive similar angles, producing coherent streams resembling wind, water currents, or diffusing ink.',
    params: {
      scale:  { value: 1.5,  min: 0.1, max: 6,    label: 'Scale S'  },
      tScale: { value: 0.4,  min: 0.05,max: 2,    label: 'Time T'   },
      speed:  { value: 0.008,min: 0.001,max: 0.04, label: 'Speed'    },
      angleA: { value: 3,    min: 0.5, max: 8,    label: 'Angle A'  },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params;
      for (let p of pts) {
        let a = noise(p.x * pm.scale.value, p.y * pm.scale.value, t * pm.tScale.value) * TWO_PI * pm.angleA.value;
        p.x += cos(a) * pm.speed.value;
        p.y += sin(a) * pm.speed.value;
        if (abs(p.x) > 1) p.x = random(-1, 1);
        if (abs(p.y) > 1) p.y = random(-1, 1);
        point(p.x * r, p.y * r);
      }
    },
  },

  { title: 'ATAN2', h: 44,
    eq: 'angle = atan2(y, x) + t',
    desc: 'atan2(y, x) returns the polar angle of any point — the angle it subtends with the x-axis. Adding t rotates the entire vector field over time, creating a spinning vortex. This operation is the foundation of swirl and twist effects in GLSL shaders.',
    params: {
      gridN:   { value: 11, min: 3,  max: 28, label: 'Grid N'   },
      lineLen: { value: 7,  min: 2,  max: 20, label: 'Line Len' },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.43, pm = this.params, n = floor(pm.gridN.value);
      for (let xi = -n; xi <= n; xi++)
        for (let yi = -n; yi <= n; yi++) {
          let x = xi / n * r, y = yi / n * r, a = atan2(y, x) + t;
          line(x, y, x + cos(a) * pm.lineLen.value, y + sin(a) * pm.lineLen.value);
        }
    },
  },

  { title: 'MOD', h: 66,
    eq: 'rad = (i \u00d7 S + t \u00d7 T) mod r',
    desc: 'A long spiral parameterised by i has its radius collapsed by mod — like folding a ruler into equal segments, all turns land in the same band. Shifting the offset inside mod over time makes rings scroll outward continuously, a core technique in repeating shader patterns.',
    params: {
      count:   { value: 600, min: 100, max: 1500, label: 'Points'  },
      spacing: { value: 0.6, min: 0.1, max: 3,    label: 'Spacing' },
      speed:   { value: 18,  min: 1,   max: 60,   label: 'Speed'   },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params;
      for (let i = 1; i < pm.count.value; i++) {
        let rad = (i * pm.spacing.value + t * pm.speed.value) % r;
        point(rad * cos(i * 0.18), rad * sin(i * 0.18));
      }
    },
  },

  { title: 'TAN', h: 88,
    eq: 'r = |tan(\u03b8 \u00d7 k)| \u00d7 scale',
    desc: 'Plotting a polar curve where radius = tan(θ×k) creates petals. tan diverges toward ±∞ near multiples of π/2, forming sharp cusps at the tips. abs() folds negatives upward. As k morphs slowly, the petal count and sharpness change continuously.',
    params: {
      kBase:  { value: 2,    min: 0.5, max: 7,   label: 'k base'  },
      kAnim:  { value: 1.2,  min: 0,   max: 4,   label: 'k anim'  },
      scale:  { value: 0.15, min: 0.01,max: 0.5, label: 'Scale'   },
      step:   { value: 0.015,min: 0.004,max:0.05,label: 'Step'    },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.38, pm = this.params;
      let k = pm.kBase.value + sin(t * 0.2) * pm.kAnim.value;
      beginShape();
      for (let theta = 0; theta < TWO_PI; theta += pm.step.value) {
        let rad = r * abs(tan(theta * k)) * pm.scale.value;
        if (rad < r) vertex(rad * cos(theta), rad * sin(theta));
      }
      endShape();
    },
  },

  { title: 'LERP', h: 110,
    eq: 'p\u2099 = lerp(p\u2099, p\u2099\u208b\u2081, \u03b1)',
    desc: 'The first node (leader) follows a Lissajous path. Each subsequent node moves α of the remaining distance toward the node ahead per frame. Later nodes lag further behind. This technique drives procedural tentacles, ropes, and follow-camera rigs.',
    params: {
      alpha:  { value: 0.18, min: 0.01, max: 0.5, label: 'Alpha \u03b1' },
      freqX:  { value: 1.1,  min: 0.1,  max: 5,   label: 'Freq X'  },
      freqY:  { value: 0.7,  min: 0.1,  max: 5,   label: 'Freq Y'  },
      nodes:  { value: 24,   min: 4,    max: 60,  label: 'Nodes'   },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.4, pm = this.params, n = floor(pm.nodes.value);
      chain[0].x = r * sin(t * pm.freqX.value);
      chain[0].y = r * sin(t * pm.freqY.value);
      for (let i = 1; i < n; i++) {
        chain[i].x = lerp(chain[i].x, chain[i - 1].x, pm.alpha.value);
        chain[i].y = lerp(chain[i].y, chain[i - 1].y, pm.alpha.value);
      }
      beginShape();
      for (let i = 0; i < n; i++) vertex(chain[i].x, chain[i].y);
      endShape();
    },
  },

  { title: 'POW', h: 132,
    eq: '|x/a|\u207f + |y/b|\u207f = 1  (Lam\u00e9 curve)',
    desc: 'A generalisation of the ellipse where n controls shape: n < 1 → concave star, n = 2 → circle, n → ∞ → square. Parametrically traced using pow(|cos θ|, 2/n). Described by Gabriel Lamé in 1818; superellipses appear in architecture, packaging, and type design.',
    params: {
      nBase:  { value: 1.5, min: 0.2, max: 8,  label: 'n base'  },
      nAnim:  { value: 1.2, min: 0,   max: 4,  label: 'n anim'  },
      speed:  { value: 0.35,min: 0.05,max: 2,  label: 'Speed'   },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      let n = max(0.15, pm.nBase.value + sin(t * pm.speed.value) * pm.nAnim.value);
      beginShape();
      for (let theta = 0; theta < TWO_PI; theta += 0.04) {
        let c = cos(theta), s = sin(theta);
        vertex(r * Math.sign(c) * pow(abs(c), 2 / n),
               r * Math.sign(s) * pow(abs(s), 2 / n));
      }
      endShape(CLOSE);
    },
  },

  { title: 'SQRT', h: 154,
    eq: 'r\u1d62 = \u221a(i / N) \u00d7 R',
    desc: 'Rings spaced by the square root of their index: sqrt grows fast near 0 then slows, so inner rings are further apart than outer ones. This natural density falloff mimics tree growth rings, sound wave decay, and how light intensity drops with distance.',
    params: {
      rings:   { value: 16, min: 3,   max: 40, label: 'Rings'    },
      wobble:  { value: 5,  min: 0,   max: 20, label: 'Wobble'   },
      wFreq:   { value: 1.2,min: 0.1, max: 6,  label: 'Wbl Freq' },
      speed:   { value: 2,  min: 0.1, max: 10, label: 'Speed'    },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params, N = floor(pm.rings.value);
      for (let i = 1; i <= N; i++) {
        let rad = sqrt(i / N) * r + sin(i * pm.wFreq.value - t * pm.speed.value) * pm.wobble.value;
        circle(0, 0, rad * 2);
      }
    },
  },

  { title: 'ABS', h: 176,
    eq: 'y = |sin(x \u00b7 f + t + \u03c6)|',
    desc: 'abs() maps all negative values to positive, folding the sine wave so every trough becomes an arch. Multiple layers with staggered phase offsets φ interweave. This fold appears in wave-shaping synthesis (generating new harmonics) and in shader symmetry tricks.',
    params: {
      layers: { value: 4,    min: 1,   max: 12,  label: 'Layers' },
      freq:   { value: 0.045,min: 0.01,max: 0.15,label: 'Freq'   },
      amp:    { value: 0.45, min: 0.1, max: 1,   label: 'Amp'    },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params, L = floor(pm.layers.value);
      for (let l = 0; l < L; l++) {
        let phase = l * PI / max(1, L);
        beginShape();
        for (let x = -r; x <= r; x += 2)
          vertex(x, r * pm.amp.value * abs(sin(x * pm.freq.value + t + phase)) - r * 0.22);
        endShape();
      }
    },
  },

  { title: 'FRACT', h: 198,
    eq: 'fx = fract((x\u1d62 + t\u00b7S) / cells)',
    desc: 'fract(x) = x − floor(x) keeps only the decimal part in [0,1). Applied to grid coordinates, every cell maps to the same 0→1 space — seamless repetition. Animating the input scrolls the pattern. This is the core trick behind infinite tiling in GLSL shaders.',
    params: {
      cells:   { value: 5,    min: 2,   max: 14, label: 'Cells'    },
      scrollX: { value: 0.15, min: 0,   max: 1,  label: 'Scroll X' },
      scrollY: { value: 0.10, min: 0,   max: 1,  label: 'Scroll Y' },
      ripple:  { value: 3,    min: 0.5, max: 8,  label: 'Ripple f' },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params, C = floor(pm.cells.value);
      for (let xi = -C; xi <= C; xi++)
        for (let yi = -C; yi <= C; yi++) {
          let fx = fract((xi + t * pm.scrollX.value) / C) - 0.5;
          let fy = fract((yi + t * pm.scrollY.value) / C) - 0.5;
          let sz = (sin(sqrt(fx * fx + fy * fy) * TWO_PI * pm.ripple.value) + 1) * 3;
          circle(xi * r / C, yi * r / C, sz + 1);
        }
    },
  },

  { title: 'EXP', h: 220,
    eq: 'r = e^(b \u00d7 \u03b8)',
    desc: 'The logarithmic spiral grows exponentially with angle: every quarter turn the radius multiplies by the same constant factor. Found throughout nature — nautilus shells, hurricanes, galaxy arms, sunflower seed arrangements. Rotating by t makes it appear to endlessly unwind.',
    params: {
      b:     { value: 0.18, min: 0.04, max: 0.5, label: 'Growth b' },
      turns: { value: 4,    min: 1,    max: 10,  label: 'Turns'    },
      scale: { value: 3,    min: 0.5,  max: 12,  label: 'Scale'    },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      beginShape();
      for (let theta = 0; theta <= TWO_PI * pm.turns.value; theta += 0.04) {
        let rad = exp(pm.b.value * theta) * pm.scale.value;
        if (rad > r) break;
        vertex(rad * cos(theta + t), rad * sin(theta + t));
      }
      endShape();
    },
  },

  { title: 'LOG', h: 242,
    eq: 'r\u1d62 = log(i+1) / log(N+1) \u00d7 R',
    desc: 'log compresses large ranges — the jump from 1→10 feels the same magnitude as 10→100. Points spaced logarithmically cluster densely near the origin and spread toward the edges. This matches human perception of pitch (octaves), loudness (decibels), and brightness (stops).',
    params: {
      N:      { value: 80, min: 10,  max: 200, label: 'Points'   },
      wobble: { value: 8,  min: 0,   max: 30,  label: 'Wobble'   },
      wFreq:  { value: 6,  min: 1,   max: 16,  label: 'Wbl Freq' },
      speed:  { value: 2,  min: 0.1, max: 8,   label: 'Speed'    },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params, N = floor(pm.N.value);
      for (let i = 1; i <= N; i++) {
        let theta  = i / N * TWO_PI;
        let rad    = log(i + 1) / log(N + 1) * r;
        let wobble = sin(theta * pm.wFreq.value - t * pm.speed.value) * pm.wobble.value;
        point((rad + wobble) * cos(theta), (rad + wobble) * sin(theta));
      }
    },
  },

  { title: 'TANH', h: 264,
    eq: 'y = tanh(sin(x \u00b7 f + t) \u00d7 gain)',
    desc: 'tanh clamps values smoothly to ±1, shaped like an S-curve. Feeding sin() through tanh with increasing gain drives the wave into saturation — peaks flatten, approaching a square wave. This is exactly how analog tape, vacuum tubes, and soft-clip circuits distort a signal.',
    params: {
      gainBase: { value: 2.5,  min: 0.1, max: 12,  label: 'Gain'      },
      gainAnim: { value: 1.8,  min: 0,   max: 6,   label: 'Gain anim' },
      freq:     { value: 0.045,min: 0.01,max: 0.15,label: 'Freq'      },
      speed:    { value: 0.4,  min: 0.05,max: 3,   label: 'Speed'     },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      let gain = pm.gainBase.value + sin(t * pm.speed.value) * pm.gainAnim.value;
      beginShape();
      for (let x = -r; x <= r; x += 2)
        vertex(x, r * 0.4 * Math.tanh(sin(x * pm.freq.value + t) * gain));
      endShape();
    },
  },

  { title: 'HYPOT', h: 286,
    eq: 'v = sin(\u221a(x\u00b2+y\u00b2) \u00d7 f \u2212 t\u00b7s)',
    desc: 'hypot(x,y) = √(x²+y²) gives the Euclidean distance from the origin. Plotting sin(distance×f − t) creates concentric wavefronts that appear to expand outward. The same equation is used for circular water ripples and radial distance-based lighting in fragment shaders.',
    params: {
      res:    { value: 13,  min: 4,    max: 26,  label: 'Grid Res'  },
      freq:   { value: 0.1, min: 0.02, max: 0.4, label: 'Freq f'    },
      speed:  { value: 2,   min: 0.1,  max: 8,   label: 'Speed s'   },
      thresh: { value: 0.3, min: 0,    max: 0.9, label: 'Threshold' },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.45, pm = this.params, res = floor(pm.res.value);
      for (let xi = -res; xi <= res; xi++)
        for (let yi = -res; yi <= res; yi++) {
          let x = xi / res * r, y = yi / res * r;
          let v = (sin(sqrt(x * x + y * y) * pm.freq.value - t * pm.speed.value) + 1) * 0.5;
          if (v > pm.thresh.value) circle(x, y, v * 6);
        }
    },
  },

  { title: 'FLOOR', h: 308,
    eq: 'y = floor(sin(x\u00b7f + t) \u00d7 N) / N',
    desc: 'floor() rounds down to the nearest integer. Multiplying by N before and dividing after quantizes the smooth sine to N discrete levels. This is analog-to-digital conversion — a continuous signal mapped to discrete steps. Fewer steps produce visible staircase aliasing.',
    params: {
      stepsBase: { value: 6,    min: 1,   max: 20,  label: 'Steps'     },
      stepsAnim: { value: 3,    min: 0,   max: 10,  label: 'Steps anim'},
      freq:      { value: 0.04, min: 0.01,max: 0.15,label: 'Freq f'    },
      speed:     { value: 0.3,  min: 0.05,max: 2,   label: 'Speed'     },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      let steps = max(1, round(pm.stepsBase.value + sin(t * pm.speed.value) * pm.stepsAnim.value));
      beginShape();
      for (let x = -r; x <= r; x += 2) {
        let raw = sin(x * pm.freq.value + t);
        vertex(x, floor(raw * steps) / steps * r * 0.42);
      }
      endShape();
    },
  },

  { title: 'CBRT', h: 330,
    eq: 'x = \u221bsin(\u03b8+t),  y = \u221bcos(f\u00b7\u03b8 + s\u00b7t)',
    desc: 'Unlike sqrt, cbrt is defined for negative inputs and is odd: cbrt(−x) = −cbrt(x). It compresses large values and expands values near zero, symmetrically on both sides. Applied to parametric sin/cos, it reshapes Lissajous-like curves into soft rounded S-forms.',
    params: {
      freqY:  { value: 1.5, min: 0.1, max: 6,  label: 'Freq f'  },
      speedY: { value: 0.6, min: 0.1, max: 3,  label: 'Speed s' },
      turns:  { value: 3,   min: 1,   max: 10, label: 'Turns'   },
    },
    draw(w, h, t) {
      let r = min(w, h) * 0.42, pm = this.params;
      beginShape();
      for (let i = 0; i <= TWO_PI * pm.turns.value; i += 0.025)
        vertex(r * Math.cbrt(sin(i + t)),
               r * Math.cbrt(cos(i * pm.freqY.value + t * pm.speedY.value)));
      endShape();
    },
  },

  { title: 'FOURIER DRAW', h: 352,
    eq: 'x(t) = Σ Aₖ cos(ωₖt + φₖ),  y(t) = Σ Aₖ sin(ωₖt + φₖ)',
    desc: 'Click and drag inside this panel to draw a closed shape. On release, a discrete Fourier transform decomposes your stroke into rotating vectors (epicycles). The circles and connecting arms replay in a loop and trace your drawing over time.',
    params: {
      terms: { value: 80,   min: 5,    max: 256, label: 'Terms'   },
      speed: { value: 1.0,  min: 0.15, max: 4,   label: 'Speed'   },
      trail: { value: 180,  min: 30,   max: 520, label: 'Trail'   },
      gain:  { value: 1.0,  min: 0.3,  max: 1.8, label: 'Scale'   },
    },
    draw(w, h, t) {
      let pm = this.params;
      let limit = floor(pm.terms.value);

      stroke(this.h, 20, 45, 22);
      line(-w * 0.44, 0, w * 0.44, 0);
      line(0, -h * 0.44, 0, h * 0.44);

      if (fourierPad.drawing) {
        stroke(this.h, 80, 100, 75);
        beginShape();
        for (let pt of fourierPad.points) vertex(pt.x, pt.y);
        endShape();
      } else if (fourierPad.coeffs.length > 0) {
        let end = drawEpicycles(0, 0, 0, fourierPad.coeffs, limit, fourierPad.time, this.h);
        fourierPad.path.unshift(end);
        if (fourierPad.path.length > floor(pm.trail.value)) fourierPad.path.pop();

        stroke(this.h, 95, 100, 90);
        noFill();
        beginShape();
        for (let v of fourierPad.path) vertex(v.x, v.y);
        endShape();

        let dt = TWO_PI / max(1, fourierPad.samples.length) * pm.speed.value;
        fourierPad.time += dt;
        if (fourierPad.time >= TWO_PI) {
          fourierPad.time = 0;
          fourierPad.path = [];
        }
      } else {
        noStroke();
        fill(this.h, 35, 100, 65);
        textSize(10);
        textAlign(CENTER, CENTER);
        text('Draw here with mouse\nto build epicycles', 0, 0);
      }
    },
  },

];
