import { drawObject, drawKinematicsObject, drawForcesObject, drawFrictionObject, drawWorkEnergyObject, drawRuler, drawVelocityArrow } from "./draw.js";
import { applyPhysics, spawnBallFreeFall, spawnBallKinematics, spawnBallForces, spawnBallFriction, spawnBallWorkEnergy } from "./physics.js";
const PixelPerMeter = 20;
const RulerStartX = 30;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


let isFinished = false;
let isReplaying = false;
let recordedFrames = [];
let replayIndex = 0;



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

function togglePause() {

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn?.disabled) return;

  isPaused = !isPaused;
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

function spawnBallFrictionWrapper() {
  spawnBallFriction(canvas, PixelPerMeter, RulerStartX, objects);
}

function spawnBallWorkEnergyWrapper() {
  spawnBallWorkEnergy(canvas, PixelPerMeter, RulerStartX, objects);
}

function clearCanvas() {
  objects = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
}

function finishSimulation() {
  isFinished = true;
  isPaused = true;

  const spawnBtn = document.getElementById("spawnBtn");
  if (spawnBtn) {
    spawnBtn.disabled = true;
    spawnBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.disabled = true;
    clearBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const replayBtn = document.getElementById("replayBtn");
  if (replayBtn) {
    replayBtn.disabled = false;
    replayBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.style.display = "block";
    requestAnimationFrame(() => simComplete.classList.add("visible"));
  }

}

function replaySimulation() {
  if (recordedFrames.length === 0) return;

  isReplaying = true;
  isPaused = true;
  replayIndex = 0;
  isFinished = false;

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.classList.add("visible");
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  // Show and reset slider
  const slider = document.getElementById("replaySlider");
  slider.max = recordedFrames.length - 1;
  slider.value = 0;
  slider.style.display = "block";

  
  const speedSelect = document.getElementById("replaySpeed");
  const replaySpeed = parseFloat(speedSelect.value || "1");

  // Timing logic
  let lastReplayTime = 0;
  let accumulatedTime = 0;

  function replayFrame(timestamp) {
    if (!lastReplayTime) lastReplayTime = timestamp;
    const deltaTime = (timestamp - lastReplayTime) / 1000;
    lastReplayTime = timestamp;
    accumulatedTime += deltaTime;

    const speedSelect = document.getElementById("replaySpeed");
    const replaySpeed = parseFloat(speedSelect?.value || "1");
    
    const frameInterval = (1 / 60) / replaySpeed;

    if (accumulatedTime >= frameInterval) {
      accumulatedTime = 0;

      if (replayIndex >= recordedFrames.length) {
        isReplaying = false;
        isFinished = true;

        const simComplete = document.getElementById("sim-complete");
        if (simComplete) simComplete.classList.add("visible");

        return;
      }

      clearCanvas();

      const frame = recordedFrames[replayIndex];
      frame.forEach((obj) => drawObject(ctx, obj)); 
      slider.value = replayIndex;
      replayIndex++;
    }

    if (isReplaying) {
      requestAnimationFrame(replayFrame);
    }
  }

  requestAnimationFrame(replayFrame);
}


function resetSimulation() {
  isPaused = false;
  isFinished = false;
  isReplaying = false;
  recordedFrames = [];
  replayIndex = 0;
  clearCanvas();

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.classList.remove("visible");
    setTimeout(() => {
      simComplete.style.display = "none";
    }, 500); // Wait for fade-out animation before hiding
  }


  const slider = document.getElementById("replaySlider");
  slider.style.display = "none";

  const spawnBtn = document.getElementById("spawnBtn");
  if (spawnBtn) {
    spawnBtn.disabled = false;
    spawnBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.disabled = false;
    clearBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const replayBtn = document.getElementById("replayBtn");
  if (replayBtn) {
    replayBtn.disabled = true;
    replayBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = false;
    pauseBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

}

function downloadReplay() {
  if (recordedFrames.length === 0) return;

  const blob = new Blob([JSON.stringify(recordedFrames)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "replay.json";
  a.click();

  URL.revokeObjectURL(url);
}

// Initialize canvas size
function update() {
  const now = performance.now();
  let deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  deltaTime = Math.min(deltaTime, 0.05)

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

  ctx.save();

  if (!currentLesson) {
    ctx.restore();
  } else {
    if (isReplaying) {
      if (replayIndex < recordedFrames.length) {
        objects = recordedFrames[replayIndex].map(o => ({ ...o }));
        document.getElementById("replaySlider").value = replayIndex;
        replayIndex++;
      } else {
        isReplaying = false;
        isPaused = true;
        document.getElementById("sim-complete").style.display = "block";
      }
    } else if (!isPaused && !isFinished) {
      const gravity = parseFloat(document.getElementById("gravity")?.value || 9.8);
      const restitution = parseFloat(document.getElementById("restitution")?.value || 0.8);
      const friction = parseFloat(document.getElementById("friction")?.value || 0);

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

      for (let o of objects) {
        applyPhysics(o, {
          currentLesson,
          collisionOnly: true
        }, objects);
      }

      const snapshot = objects.map(o => ({
        ...o,
        x: o.x,
        y: o.y,
        vx: o.vx,
        vy: o.vy,
        ax: o.ax,
        ay: o.ay
      }));
      recordedFrames.push(snapshot);
    }

    // Draw all objects
    for (const obj of objects) {
      switch (currentLesson) {
        case "freefall":
          drawObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "kinematics":
          drawKinematicsObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "forces":
          drawForcesObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "friction":
          drawFrictionObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "workEnergy":
          drawWorkEnergyObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
      }
    }
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
          <button id="spawnBtn" onclick="spawnBallFreeFallWrapper()">Spawn Ball</button>
          <button id="clearBtn" onclick="clearCanvas()">Clear</button>
          <button onclick="finishSimulation()">Finish</button>
          <button id="replayBtn" onclick="replaySimulation()">Replay</button>
          <button onclick="resetSimulation()">Reset</button>
          <br/><br/>
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
          <button id="spawnBtn" onclick="spawnBallKinematicsWrapper()">Spawn Ball</button>
          <button id="clearBtn" onclick="clearCanvas()">Clear</button>
          <button onclick="finishSimulation()">Finish</button>
          <button id="replayBtn" onclick="replaySimulation()">Replay</button>
          <button onclick="resetSimulation()">Reset</button>
          <br/><br/>
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
          <button id="spawnBtn" onclick="spawnBallForcesWrapper()">Spawn Ball</button>
          <button id="clearBtn" onclick="clearCanvas()">Clear</button>
          <button onclick="finishSimulation()">Finish</button>
          <button id="replayBtn" onclick="replaySimulation()">Replay</button>
          <button onclick="resetSimulation()">Reset</button>
          <br/><br/>
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
          <button id="spawnBtn" onclick="spawnBallFrictionWrapper()">Spawn Ball</button>
          <button id="clearBtn" onclick="clearCanvas()">Clear</button>
          <button onclick="finishSimulation()">Finish</button>
          <button id="replayBtn" onclick="replaySimulation()">Replay</button>
          <button onclick="resetSimulation()">Reset</button>
          <br/><br/>
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
      <button id="spawnBtn" onclick="spawnBallWorkEnergyWrapper()">Spawn Energy Ball</button>
      <button id="clearBtn" onclick="clearCanvas()">Clear</button>
      <button onclick="finishSimulation()">Finish</button>
      <button id="replayBtn" onclick="replaySimulation()">Replay</button>
      <button onclick="resetSimulation()">Reset</button>
      <br/><br/>
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
  const replayBtn = document.getElementById("replayBtn");
  if (replayBtn) {
    replayBtn.disabled = true;
    replayBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  window.spawnBallFreeFallWrapper = spawnBallFreeFallWrapper;
  window.spawnBallKinematicsWrapper = spawnBallKinematicsWrapper;
  window.spawnBallForcesWrapper = spawnBallForcesWrapper;
  window.spawnBallFrictionWrapper = spawnBallFrictionWrapper;
  window.spawnBallWorkEnergyWrapper = spawnBallWorkEnergyWrapper;

  window.clearCanvas = clearCanvas;
  window.switchLesson = switchLesson;
  window.togglePause = togglePause;
  window.finishSimulation = finishSimulation;
  window.replaySimulation = replaySimulation;
  window.resetSimulation = resetSimulation;
  window.downloadReplay = downloadReplay;

}


document.querySelectorAll('#nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const lesson = btn.getAttribute('data-lesson');
    switchLesson(lesson);
  });
});

document.getElementById("replaySlider").addEventListener("input", (e) => {
  if (recordedFrames.length > 0) {
    isReplaying = false;
    isPaused = true;
    const index = parseInt(e.target.value, 10);
    replayIndex = index;
    objects = recordedFrames[replayIndex].map(o => ({ ...o }));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

    for (const obj of objects) {
      switch (currentLesson) {
        case "freefall":
          drawObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "kinematics":
          drawKinematicsObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "forces":
          drawForcesObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "friction":
          drawFrictionObject(ctx, obj, PixelPerMeter);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "workEnergy":
          drawWorkEnergyObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityArrow(ctx, obj, PixelPerMeter, 0.5);
          break;
      }
    }
  }
});

const desc = document.getElementById("lesson-description");
desc.innerHTML = "<em>Click a lesson button to start!</em>";

update();