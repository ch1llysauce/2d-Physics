import { applyPhysics } from "./physics.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const PixelPerMeter = 20;
const RulerStartX = 30; //Starting X position for the ruler

let objects = [];
let currentLesson = null;
let lastTime = performance.now();
let isPaused = false;

function togglePause() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById("pauseBtn");

  if (pauseBtn) {
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    // Toggle color class
    pauseBtn.classList.toggle("pause-red", isPaused);
  }
}

function spawnBall(x = null, y = null, vx = null, vy = null) {
  const velInput = document.getElementById("initVel");
  const heightInput = document.getElementById("initHeight");
  const initXInput = document.getElementById("initX");
  const gravityInput = document.getElementById("gravity");
  const gravityVal = gravityInput ? parseFloat(gravityInput.value) : 9.8;
  const restitutionInput = document.getElementById("restitution");
  const restitutionVal = restitutionInput ? parseFloat(restitutionInput.value) : 0.8;

  vx = vx !== null ? vx : 0;
  vy = vy !== null ? vy : (velInput ? parseFloat(velInput.value) : 0);

  const heightMeters = heightInput ? parseFloat(heightInput.value) : 2.5;
  y = y !== null ? y : canvas.height - (heightMeters * PixelPerMeter);
  y = Math.max(0, Math.min(canvas.height - 20, y)); // clamp to canvas bounds 

  const xMeters = initXInput ? parseFloat(initXInput.value) : 0;
  x = x !== null ? x : RulerStartX + (xMeters * PixelPerMeter);
  x = Math.max(20, Math.min(canvas.width - 20, x)); // clamp to canvas bounds

  objects.push({ x, y, vx, vy, radius: 20, gravity: gravityVal, restitution: restitutionVal });
}


function spawnSlidingBox() {
  objects.push({ x: 100, y: 300, vx: 2, vy: 0, w: 40, h: 20 }); //width and height of 40 and 20 for the box
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objects = [];
}

function drawObject(obj) {
  ctx.beginPath();
  if (obj.radius) {
    ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  } else {
    ctx.rect(obj.x, obj.y, obj.w, obj.h);
  }

  ctx.fillStyle = "#0077cc";
  ctx.fill();

  const heightMeters = ((canvas.height - obj.y) / PixelPerMeter).toFixed(1);
  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${heightMeters}m`, obj.x, obj.y - (obj.radius || obj.h / 2) - 5);

  const vy = (obj.vy ?? 0).toFixed(2);
  ctx.fillText(`v: ${Math.abs(vy)} m/s`, obj.x, obj.y + (obj.radius || obj.h / 2) + 15);
}

function drawRuler() {
  const rulerX = RulerStartX;
  const rulerY = canvas.height - 30;
  const interval = 50;

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";

  // --- Vertical Ruler ---
  ctx.beginPath();
  ctx.moveTo(rulerX, 0);
  ctx.lineTo(rulerX, canvas.height);
  ctx.stroke();

  ctx.textAlign = "right";
  for (let i = 0; i <= canvas.height; i += 2 * interval) {
    const y = canvas.height - i;

    if (y < 15 || y > canvas.height - 10) continue;

    ctx.beginPath();
    ctx.moveTo(rulerX - 5, y);
    ctx.lineTo(rulerX + 5, y);
    ctx.stroke();

    ctx.fillText(`${i / PixelPerMeter}m`, rulerX - 10, y + 4);
  }

  // --- Horizontal Ruler ---
  ctx.beginPath();
  ctx.moveTo(0, rulerY);
  ctx.lineTo(canvas.width, rulerY);
  ctx.stroke();

  ctx.textAlign = "center";
  for (let x = rulerX; x < canvas.width; x += 2 * interval) {
    if (x < 40 || x > canvas.width - 20) continue;

    ctx.beginPath();
    ctx.moveTo(x, rulerY - 5);
    ctx.lineTo(x, rulerY + 5);
    ctx.stroke();

    ctx.fillText(`${(x - rulerX) / PixelPerMeter}m`, x, rulerY + 20);
  }
}

function drawVelocityArrow(obj, scale = 10){
  const vx = obj.vx ?? 0;
  const vy = obj.vy ?? 0;
  const speed = Math.hypot(vx, vy);

  if(speed < 0.1) return; // Don't draw if speed is negligible

  const startX = obj.x;
  const startY = obj.y;
  const endX = startX + (vx * scale);
  const endY = startY + (vy * scale); // Invert Y for canvas

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.stroke();

  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 8;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(endX, endY);
  ctx.fillStyle = "#ff0000";
  ctx.fill();
}
// Initialize canvas size
function update() {
  const now = performance.now();
  let deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  deltaTime = Math.min(deltaTime, 0.05)

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRuler();

  if (!currentLesson) {
    requestAnimationFrame(update);
    return;
  }

  if (!isPaused) {
    const gravity = parseFloat(document.getElementById("gravity")?.value || 9.8);
    const restitution = parseFloat(document.getElementById("restitution")?.value || 0.8);
    const friction = parseFloat(document.getElementById("friction")?.value || 0);

    // 1st pass: apply motion
    for (let o of objects) {
      applyPhysics(o, {
        gravity,
        restitution,
        canvasHeight: canvas.height,
        deltaTime,
        currentLesson,
        friction,
        skipCollision: true
      }, objects);
    }

    // 2nd pass: resolve collisions
    for (let o of objects) {
      applyPhysics(o, {
        currentLesson,
        collisionOnly: true
      }, objects);
    }
  }

  for (let o of objects) {
    drawObject(o);
    drawVelocityArrow(o);
  }
  requestAnimationFrame(update);

}



function switchLesson(lesson) {
  currentLesson = lesson;
  localStorage.setItem("currentLesson", lesson);
  updateLessonUI();
  clearCanvas();

  // Update active button
  document.querySelectorAll('#nav button').forEach(btn => {
    const isActive = btn.getAttribute('data-lesson') === lesson;
    btn.classList.toggle('active', isActive);
  });
}

function updateLessonUI() {
  const desc = document.getElementById("lesson-description");
  const controls = document.getElementById("controls");
  controls.innerHTML = ''; // Clear previous controls


  if (currentLesson === "freefall") {
    desc.innerHTML = "This lesson demonstrates the effect of gravity on objects. You can add objects to the canvas and see how they fall under the influence of gravity.";
    controls.innerHTML = `
      <div id="freefall-controls">
        <button onclick="spawnBall()">Spawn Ball</button>
        <button onclick="clearCanvas()">Clear</button>
        Gravity: <input id="gravity" type="number" value="9.8" step="0.1" style="width: 60px" />
        Initial Velocity: <input id="initVel" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Height (Y): <input id="initHeight" type="number" value="10" step="1" style="width: 60px" />
        Initial X Position: <input id="initX" type="number" value="0" step="1" style="width: 60px" />
        Restitution (0-1): <input id="restitution" type="number" value="0.8" step="0.1" min="0" max="1" />
        </div>
    `;
  }

  if (currentLesson === "kinematics") {

    desc.innerHTML = "This screen demonstrates velocity and acceleration without forces.";
    controls.innerHTML = `
      <div id="kinematics-controls">
        <button onclick="spawnBall()">Spawn Right-Moving Ball</button>
        Initial Velocity: <input id="initVel" type="number" value="3" step="0.5" style="width: 60px" />
      </div>
    `;
  }

  if (currentLesson === "forces") {
    desc.innerHTML = "This lesson demonstrates Newton's Second Law: how force, mass, and angle affect an object’s acceleration and motion.";
    controls.innerHTML = `
      <div id="forces-controls">
        <button onclick="spawnBall()">Spawn Ball</button>
        <button onclick="applyForce()">Apply Force</button>
        Force: <input id="force" type="number" value="10" step="0.1" style="width: 60px" />
        Mass: <input id="mass" type="number" value="1" step="0.1" style="width: 60px" />
        Angle: <input id="angle" type="number" value="0" step="1" style="width: 60px" />
      </div>
      `;
  }

  if (currentLesson === "friction") {
    desc.innerHTML = "This lesson demonstrates the effect of friction on objects. You can add objects and apply forces to see how they move with friction.";
    controls.innerHTML = `
      <div id="friction-controls">
        <button onclick="spawnBall()">Spawn Ball</button>
        <button onclick="applyForce()">Apply Force</button>
        Force: <input id="force" type="number" value="10" step="0.1" style="width: 60px" />
        Mass: <input id="mass" type="number" value="1" step="0.1" style="width: 60px" />
        Angle: <input id="angle" type="number" value="0" step="1" style="width: 60px" />
        Friction Coefficient: <input id="friction" type="number" value="0.5" step="0.01" style="width: 60px" />
      </div>
    `;
  }

  if (currentLesson === "workEnergy") {
    desc.innerHTML = "This lesson demonstrates the transformation between potential and kinetic energy as a ball bounces under gravity.";
    controls.innerHTML = `
    <div id="work-energy-controls">
    <button onclick="spawnBall()">Spawn Energy Ball</button>
    <button onclick="clearCanvas()">Clear</button>
    Gravity: <input id="gravity" type="number" value="9.8" step="0.1" style="width: 60px" />
    Initial Height: <input id="initialHeight" type="number" value="100" step="1" style="width: 60px" />
    Restitution: <input id="restitution" type="number" value="0.8" step="0.1" style="width: 60px" />
    </div>
    `;
  }

  controls.innerHTML += `
  <button onclick="togglePause()" id="pauseBtn" class="button">Pause</button>
`;

}


document.querySelectorAll('#nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const lesson = btn.getAttribute('data-lesson');
    switchLesson(lesson);
  });
});

const desc = document.getElementById("lesson-description");
desc.innerHTML = "<em>Click a lesson button to start!</em>";


window.spawnBall = spawnBall;
window.clearCanvas = clearCanvas;
window.switchLesson = switchLesson;
window.togglePause = togglePause;

update();