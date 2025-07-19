import { drawObject, drawKinematicsObject, drawForcesObject, drawFrictionObject, drawWorkEnergyObject, drawRuler, drawVelocityArrow } from "./draw.js";
import { applyPhysics, spawnBallFreeFall, spawnBallKinematics, spawnBallForces, spawnBallFriction, spawnBallWorkEnergy } from "./physics.js";
const PixelPerMeter = 20;
const RulerStartX = 30;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


let isFinished = false;
let isReplaying = false;
let recordedFrames = [];
let replayIndex = 0
let replayTimer = null;


document.getElementById("replaySpeed").addEventListener("change", () => {
  if (isReplaying) {
    clearTimeout(replayTimer);
    replayNextFrame();
  }
});

function replayNextFrame() {
  if (replayIndex >= recordedFrames.length) {
    isReplaying = false;
    return;
  }

  const frame = recordedFrames[replayIndex];

  
  objects = frame.map(o => ({ ...o })); // sync global state with this frame

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

  // Update slider
  const slider = document.getElementById("replaySlider");
  if (slider) slider.value = replayIndex;

  replayIndex++;

  const speed = parseFloat(document.getElementById("replaySpeed").value);
  const interval = 1000 / 60 / speed; // base 60 FPS

  replayTimer = setTimeout(() => {
    replayNextFrame();
  }, interval);
}

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
  isFinished = false;
  replayIndex = 0;

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.classList.add("visible");
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const slider = document.getElementById("replaySlider");
  slider.max = recordedFrames.length - 1;
  slider.value = 0;
  slider.style.display = "block";

  startReplay();
}


function startReplay() {
  if (replayTimer) clearTimeout(replayTimer);
  replayNextFrame();
}


function resetSimulation() {
  clearTimeout(replayTimer);

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

function downloadReplayAsVideo(frameRate = 60) {
  if (recordedFrames.length === 0) return;

  const stream = canvas.captureStream(frameRate);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm" // browsers don't support .mp4 directly
  });

  const recordedChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "replay.webm";
    a.click();

    URL.revokeObjectURL(url);
  };

  let index = 0;
  mediaRecorder.start();

  const interval = 1000 / frameRate;
  const replayInterval = setInterval(() => {
    if (index >= recordedFrames.length) {
      clearInterval(replayInterval);
      mediaRecorder.stop();
      return;
    }

    // Restore frame
    const frame = recordedFrames[index++];
    objects = frame.data.map(o => ({ ...o })); // depends on your format
    clearCanvas(); // your own function to wipe canvas
    drawAllObjects(); // call your actual drawing logic
  }, interval);
}

function drawAllObjects() {
  if (!objects) return;

  clearCanvas(); // your own clear function

  switch (currentLesson) {
    case "Free Fall":
      objects.forEach(obj => drawObject(ctx, obj, PixelPerMeter, RulerStartX));
      break;
    case "Kinematics":
      objects.forEach(obj => drawKinematicsObject(ctx, obj, PixelPerMeter, RulerStartX));
      break;
    case "Forces":
      objects.forEach(obj => drawForcesObject(ctx, obj, PixelPerMeter, RulerStartX));
      break;
    case "Friction":
      objects.forEach(obj => drawFrictionObject(ctx, obj, PixelPerMeter, RulerStartX));
      break;
    case "Work & Energy":
      objects.forEach(obj => drawWorkEnergyObject(ctx, obj, PixelPerMeter, RulerStartX));
      break;
    default:
      objects.forEach(obj => drawObject(ctx, obj, PixelPerMeter, RulerStartX));
  }

  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
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
      const frame = recordedFrames[replayIndex];
      if (frame) {
        objects = frame.map(o => ({ ...o }));
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
      return;
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
  window.downloadReplayAsVideo = downloadReplayAsVideo;

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