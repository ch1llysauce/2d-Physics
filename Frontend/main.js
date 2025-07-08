import { applyPhysics, spawnBallFreeFall, spawnBallKinematics, spawnBallForces } from "./physics.js";

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

function spawnBallFreeFallWrapper() {
  spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, objects);
}

function spawnBallKinematicsWrapper() {
  spawnBallKinematics(canvas, PixelPerMeter, RulerStartX, objects);
}

function spawnBallForcesWrapper() {
  spawnBallForces(canvas, PixelPerMeter, RulerStartX, objects);
}
function spawnSlidingBox() {
  objects.push({ x: 100, y: 300, vx: 2, vy: 0, w: 40, h: 20 }); //width and height of 40 and 20 for the box
}

function clearCanvas() {
  objects = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRuler();
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
  ctx.fillText(`v: ${-vy} m/s`, obj.x, obj.y + (obj.radius || obj.h / 2) + 15);
}

function drawKinematicsObject(obj) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#0077cc";
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const vx = ((obj.vx ?? 0) / PixelPerMeter).toFixed(2);
  const vy = ((-obj.vy ?? 0) / PixelPerMeter).toFixed(2);
  function formatVelocity(obj, PixelPerMeter) {
    const vy = obj.vy ?? 0;
    const vx = obj.vx ?? 0;
    const speed = Math.hypot(vx, vy) / PixelPerMeter;

    return (vy > 0 ? -speed : speed).toFixed(2);
  }


  ctx.fillText(`vx: ${vx} m/s`, obj.x, obj.y - obj.radius - 10);
  ctx.fillText(`vy: ${vy} m/s`, obj.x, obj.y - obj.radius + 5);
  ctx.fillText(`v: ${formatVelocity(obj, PixelPerMeter)} m/s`, obj.x, obj.y + obj.radius + 15);
}

function drawForcesObject(obj) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#cc3300"; // Different color for Forces
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const vx = ((obj.vx ?? 0) / PixelPerMeter).toFixed(2);
  const vy = ((-obj.vy ?? 0) / PixelPerMeter).toFixed(2);

  function formatVelocity(obj, PixelPerMeter) {
    const vy = obj.vy ?? 0;
    const vx = obj.vx ?? 0;
    const speed = Math.hypot(vx, vy) / PixelPerMeter;
    return (vy > 0 ? -speed : speed).toFixed(2);
  }

  ctx.fillText(`vx: ${vx} m/s`, obj.x, obj.y - obj.radius - 10);
  ctx.fillText(`vy: ${vy} m/s`, obj.x, obj.y - obj.radius + 5);
  ctx.fillText(`v: ${formatVelocity(obj, PixelPerMeter)} m/s`, obj.x, obj.y + obj.radius + 15);

  const { ax, ay } = getAccelerationFromForce(obj);
  const aMagnitude = Math.hypot(ax, ay).toFixed(2);
  ctx.fillText(`a: ${aMagnitude} m/s²`, obj.x, obj.y + obj.radius + 30);
}

function applyForce() {
  const force = parseFloat(document.getElementById("force")?.value || 10);
  const angle = parseFloat(document.getElementById("angle")?.value || 0) * Math.PI / 180;

  for (let obj of objects) {
    obj.force = force;
    obj.angle = angle;
  }
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

function drawVelocityArrow(obj, scale = 10) {
  const vx = obj.vx ?? 0;
  const vy = obj.vy ?? 0;
  const speed = Math.hypot(vx, vy);

  if (speed < 0.1) return; // Don't draw if speed is negligible

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
    if (currentLesson === "kinematics") {
      drawKinematicsObject(o);
    } else if (currentLesson === "forces") {
      drawForcesObject(o);
    } else {
      drawObject(o);
    }
    drawVelocityArrow(o);
  }
  requestAnimationFrame(update);

}



function switchLesson(lesson) {
  currentLesson = lesson;
  localStorage.setItem("currentLesson", lesson);
  clearCanvas();
  updateLessonUI();

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
        <button onclick="spawnBallFreeFallWrapper()">Spawn Ball</button>
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
        <button onclick="spawnBallKinematicsWrapper()">Spawn Ball</button>
        <button onclick="clearCanvas()">Clear</button>
        Initial X Position: <input id="initX" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Y Position: <input id="initY" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Velocity X: <input id="initVelX" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Velocity Y: <input id="initVelY" type="number" value="0" step="0.5" style="width: 60px" />
        Acceleration X: <input id="accelX" type="number" value="0" step="0.5" style="width: 60px" />
        Acceleration Y: <input id="accelY" type="number" value="0" step="0.5" style="width: 60px" />
        </div>
    `;
  }

  if (currentLesson === "forces") {
    desc.innerHTML = "This lesson demonstrates Newton's Second Law: how force, mass, and angle affect an object's acceleration and motion.";
    controls.innerHTML = `
      <div id="forces-controls">
        <button onclick="spawnBallForcesWrapper()">Spawn Ball</button>
        <button onclick="clearCanvas()">Clear</button>
        Force: <input id="force" type="number" value="10" step="0.1" style="width: 60px" />
        Mass: <input id="mass" type="number" value="1" step="0.1" style="width: 60px" />
        Angle: <input id="angle" type="number" value="0" step="1" style="width: 60px" />
        <br/><br/>
        Initial Velocity X: <input id="initVelX" type="number" value="0" step="0.1" style="width: 60px" />
        Initial Velocity Y: <input id="initVelY" type="number" value="0" step="0.1" style="width: 60px" />
        Initial X Position: <input id="initX" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Y Position: <input id="initY" type="number" value="0" step="0.5" style="width: 60px" />
        <br/><br/>
        <label><input type="checkbox" id="useGravity" checked /> Use Gravity</label>
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

  window.spawnBallFreeFallWrapper = spawnBallFreeFallWrapper;
  window.spawnBallKinematicsWrapper = spawnBallKinematicsWrapper;
  window.spawnBallForcesWrapper = spawnBallForcesWrapper;
  window.clearCanvas = clearCanvas;
  window.switchLesson = switchLesson;
  window.togglePause = togglePause;
}


document.querySelectorAll('#nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const lesson = btn.getAttribute('data-lesson');
    switchLesson(lesson);
  });
});

const desc = document.getElementById("lesson-description");
desc.innerHTML = "<em>Click a lesson button to start!</em>";


window.spawnBallFreeFallWrapper = spawnBallFreeFallWrapper;
window.spawnBallKinematicsWrapper = spawnBallKinematicsWrapper;
window.spawnBallForcesWrapper = spawnBallForcesWrapper;
window.clearCanvas = clearCanvas;
window.switchLesson = switchLesson;
window.togglePause = togglePause;

update();