import { drawObject, drawKinematicsObject, drawForcesObject, drawFrictionObject, drawWorkEnergyObject, drawRuler, drawVelocityArrow } from "./draw.js";
import { applyPhysics, spawnBallFreeFall, spawnBallKinematics, spawnBallForces, spawnBallFriction, spawnBallWorkEnergy } from "./physics.js";
const PixelPerMeter = 20;
const RulerStartX = 30;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const width = wrapper.clientWidth;
  const height = width / 2; // 2:1 aspect ratio

  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let objects = [];
let currentLesson = null;
let lastTime = performance.now();
let isPaused = false;

let zoomLevel = 1;
const minZoom = 0.5;
const maxZoom = 2.5;
const zoomStep = 0.1;

function togglePause() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById("pauseBtn");

  if (pauseBtn) {
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    // Toggle color class
    pauseBtn.classList.toggle("pause-red", isPaused);
  }
}

function zoomIn() {
  zoomLevel = Math.max(minZoom, (zoomLevel + zoomStep).toFixed(2));
}

function zoomOut() {

  zoomLevel = Math.min(maxZoom, (zoomLevel - zoomStep).toFixed(2));
}


function spawnBallFreeFallWrapper() {
  spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, zoomLevel, objects);
}

function spawnBallKinematicsWrapper() {
  spawnBallKinematics(canvas, PixelPerMeter, RulerStartX, zoomLevel, objects);
}

function spawnBallForcesWrapper() {
  spawnBallForces(canvas, PixelPerMeter, RulerStartX, zoomLevel, objects);
}

function spawnBallFrictionWrapper() {
  spawnBallFriction(canvas, PixelPerMeter, RulerStartX, zoomLevel, objects);
}

function spawnBallWorkEnergyWrapper() {
  spawnBallWorkEnergy(canvas, PixelPerMeter, RulerStartX, zoomLevel, objects);
}

function clearCanvas() {
  objects = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX, zoomLevel);
}


// Initialize canvas size
function update() {
  zoomLevel = Math.min(maxZoom, Math.max(minZoom, zoomLevel));

  const now = performance.now();
  let deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  deltaTime = Math.min(deltaTime, 0.05)

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);   // Step 1: Reset
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Step 2: Clear
  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX, zoomLevel); // Step 3: Draw ruler

  ctx.setTransform(1, 0, 0, 1, 0, 0);   // Step 4: Reset again
  ctx.translate(canvas.width / 2, canvas.height / 2); // Step 5: Zoom
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);



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
      drawKinematicsObject(ctx, o, PixelPerMeter, canvas);
    } else if (currentLesson === "forces") {
      drawForcesObject(ctx, o, PixelPerMeter);
    } else if (currentLesson === "friction") {
      drawFrictionObject(ctx, o, PixelPerMeter);
    } else if (currentLesson === "workEnergy") {
      drawWorkEnergyObject(ctx, o, PixelPerMeter, canvas);
    } else {
      drawObject(ctx, o, PixelPerMeter, canvas);
    }
    drawVelocityArrow(ctx, o);
  }
  ctx.restore();
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

  requestAnimationFrame(update);
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
            <br/><br/>
            Initial Height (Y): <input id="initHeight" type="number" value="10" step="1" style="width: 60px" />
            Initial X Position: <input id="initX" type="number" value="0" step="1" style="width: 60px" />
            Restitution (0-1): <input id="restitution" type="number" value="0.8" step="0.1" min="0" max="1" style="width: 60px" />
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
            <br/><br/>
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
            Mass: <input id="mass" type="number" value="1" step="0.1" min="0" style="width: 60px" />
            Angle: <input id="angle" type="number" value="0" step="1" style="width: 60px" />
            <br/><br/>
            Initial Velocity X: <input id="initVelX" type="number" value="0" step="0.1" style="width: 60px" />
            Initial Velocity Y: <input id="initVelY" type="number" value="0" step="0.1" style="width: 60px" />
            Initial X Position: <input id="initX" type="number" value="0" step="0.5" style="width: 60px" />
            Initial Y Position: <input id="initY" type="number" value="0" step="0.5" style="width: 60px" />
            <br/><br/>
            <div class="center-checkbox">
            <label for="useGravity"><input type="checkbox" id="useGravity" checked /> Use Gravity</label>
            </div>
          </div>
          `;
  }

  if (currentLesson === "friction") {
    desc.innerHTML = "This lesson demonstrates the effect of friction on objects. You can add objects and apply forces to see how they move with friction.";
    controls.innerHTML = `
          <div id="friction-controls">
            <button onclick="spawnBallFrictionWrapper()">Spawn Ball</button>
            <button onclick="clearCanvas()">Clear</button>
            Mass: <input id="mass" type="number" value="1" step="0.1" style="width: 60px" />
            Friction Coefficient: <input id="friction" type="number" value="0.5" step="0.01" min="0" max="1" style="width: 60px" />
            <br/><br/>
            Initial Velocity X: <input id="initVelX" type="number" value="0" step="0.1" style="width: 60px" />
            Initial Velocity Y: <input id="initVelY" type="number" value="0" step="0.1" style="width: 60px" />
            Initial X Position: <input id="initX" type="number" value="0" step="0.5" style="width: 60px" />
            Initial Y Position: <input id="initY" type="number" value="0" step="0.5" style="width: 60px" />
            Gravity: <input id="gravity" type="number" value="9.8" step="0.1" style="width: 60px" />
          </div>
        `;
  }

  if (currentLesson === "workEnergy") {
    desc.innerHTML = "This lesson demonstrates the transformation between potential and kinetic energy as a ball bounces under gravity.";
    controls.innerHTML = `
        <div id="work-energy-controls">
        <button onclick="spawnBallWorkEnergyWrapper()">Spawn Energy Ball</button>
        <button onclick="clearCanvas()">Clear</button>
        Mass: <input id="mass" type="number" value="1" step="0.1" style="width: 60px" />
        Gravity: <input id="gravity" type="number" value="9.8" step="0.1" style="width: 60px" />
        Initial X Position: <input id="initX" type="number" value="0" step="1" style="width: 60px" />
        Initial Height (Y): <input id="initHeight" type="number" value="10" step="1" style="width: 60px" />
        <br/><br/>
        Restitution: <input id="restitution" type="number" value="0.8" step="0.1" style="width: 60px" />
        Initial Velocity X: <input id="initVelX" type="number" value="0" step="0.5" style="width: 60px" />
        Initial Velocity Y: <input id="initVelY" type="number" value="0" step="0.5" style="width: 60px" />
        </div>
        `;
  }

  controls.innerHTML += `
      <button onclick="togglePause()" id="pauseBtn" class="button">Pause</button>
    `;

  window.spawnBallFreeFallWrapper = spawnBallFreeFallWrapper;
  window.spawnBallKinematicsWrapper = spawnBallKinematicsWrapper;
  window.spawnBallForcesWrapper = spawnBallForcesWrapper;
  window.spawnBallFrictionWrapper = spawnBallFrictionWrapper;
  window.spawnBallWorkEnergyWrapper = spawnBallWorkEnergyWrapper;

  window.clearCanvas = clearCanvas;
  window.switchLesson = switchLesson;
  window.togglePause = togglePause;

  window.zoomIn = zoomIn;
  window.zoomOut = zoomOut;

}


document.querySelectorAll('#nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const lesson = btn.getAttribute('data-lesson');
    switchLesson(lesson);
  });
});

const desc = document.getElementById("lesson-description");
desc.innerHTML = "<em>Click a lesson button to start!</em>";

update();