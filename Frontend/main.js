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
let isStarted = false;
let lastReplayTime = null;
let replaySpeed = 1;
let replayStartTime = 0;
let recordingStartTime = performance.now();
let simulationStartTime = null;
let totalElapsedTime = 0;

document.getElementById("replaySpeed").addEventListener("change", (e) => {
  replaySpeed = parseFloat(e.target.value);
});

function startSimulation() {
  if (isStarted || isReplaying || isFinished || objects.length === 0) return;

  isStarted = true;
  isPaused = false;
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = false;
    pauseBtn.style.display = "inline-block";
  }

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  requestAnimationFrame(update);
}


function prepareNewSimulation() {
  clearTimeout(replayTimer);

  recordedFrames = [];
  replayIndex = 0;
  isStarted = false;
  isReplaying = false;
  isPaused = false;
  isFinished = false;
  lastReplayTime = null;
  replayStartTime = null;
  simulationStartTime = null;
  totalElapsedTime = 0;

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.classList.remove("visible");
    simComplete.style.display = "none";
  }

  const slider = document.getElementById("replaySlider");
  if (slider) {
    slider.style.display = "none";
  }

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

  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) {
    timerDisplay.innerText = `0.00 s`;
  }

}

function replayLoop(timestamp) {
  if (!isReplaying || isPaused) return;

  if (!lastReplayTime) lastReplayTime = timestamp;

  const currentTime = (timestamp - replayStartTime) * replaySpeed;


  while (
    replayIndex < recordedFrames.length - 1 &&
    recordedFrames[replayIndex + 1].time <= currentTime
  ) {
    replayIndex++;

    const slider = document.getElementById("replaySlider");
    if (slider) slider.value = replayIndex;
  }

  if (replayIndex >= recordedFrames.length && currentTime >= recordedFrames[recordedFrames.length - 1].time) {
    replayIndex = recordedFrames.length - 1;
    isReplaying = false;
    return;

  }

  const frame = recordedFrames[replayIndex];
  objects = frame.objects.map(o => ({ ...o }));

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

  const slider = document.getElementById("replaySlider");
  if (slider) {
    slider.addEventListener("input", handleSliderScrub);
  }

  if (!isReplaying && !isPaused && simulationStartTime !== null) {
    const now = performance.now();
    const currentElapsed = (now - simulationStartTime) / 1000;
    const displayTime = totalElapsedTime + currentElapsed;

    const timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay) {
      timerDisplay.innerText = `${displayTime.toFixed(2)} s`;
    }
  }


  if (isReplaying && !isPaused && replayIndex < recordedFrames.length) {
    const now = performance.now();
    const elapsed = (now - replayStartTime) * replaySpeed / 1000;

    const timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay) {
      timerDisplay.innerText = `${elapsed.toFixed(2)} s`;
    }

    if (replayIndex == recordedFrames.length - 1) {
      isReplaying = false;
      isFinished = true;

      const lastFrame = recordedFrames[replayIndex];
      if (timerDisplay && lastFrame?.time != null) {
        timerDisplay.innerText = `${(lastFrame.time / 1000).toFixed(2)} s`;
      }
    }
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (replayIndex === recordedFrames.length - 1 &&
    currentTime >= recordedFrames[recordedFrames.length - 1].time) {
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    pauseBtn.classList.remove("pause-red");
  }

  requestAnimationFrame(replayLoop);
}

function handleSliderScrub(e) {
  const index = parseInt(e.target.value);
  if (isNaN(index) || index < 0 || index >= recordedFrames.length) return;

  replayIndex = index;
  isReplaying = false;
  isPaused = true;

  const frame = recordedFrames[replayIndex];
  objects = frame.objects.map(o => ({ ...o }));
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

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    const atLastFrame = replayIndex === recordedFrames.length - 1;
    pauseBtn.disabled = atLastFrame;
    pauseBtn.textContent = "Pause";
    pauseBtn.classList.remove("pause-red");
  }

  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay && recordedFrames[replayIndex]?.time != null) {
    timerDisplay.innerText = `${(recordedFrames[replayIndex].time / 1000).toFixed(2)} s`;
  }

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

  if (!isReplaying && isPaused && recordedFrames.length > 0) {
    isReplaying = true;
    isPaused = false;

    const currentScrubTime = recordedFrames[replayIndex]?.time ?? 0;
    replayStartTime = performance.now() - currentScrubTime / replaySpeed;
    lastReplayTime = null;

    requestAnimationFrame(replayLoop);
    pauseBtn.textContent = "Pause";
    pauseBtn.classList.remove("pause-red");
    return;
  }

  isPaused = !isPaused;

  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  pauseBtn.classList.toggle("pause-red", isPaused);
  pauseBtn.disabled = false;
  pauseBtn.style.display = "inline-block";


  if (isReplaying) {
    if (isPaused) {
      drawCurrentReplayFrame();
    } else {
      const currentScrubTime = recordedFrames[replayIndex]?.time ?? 0;
      replayStartTime = performance.now() - currentScrubTime / replaySpeed;
      lastReplayTime = null;

      requestAnimationFrame(replayLoop);
    }
  } else {
    if (!isPaused) {
      requestAnimationFrame(update);
    }
  }
}

function drawCurrentReplayFrame() {
  const frame = recordedFrames[replayIndex];
  if (frame) {
    objects = frame.objects.map(o => ({ ...o }));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
    for (const obj of objects) {
      drawObject(ctx, obj);
    }

    const slider = document.getElementById("replaySlider");
    if (slider) slider.value = replayIndex;
  }
}


function spawnBallFreeFallWrapper() {
  prepareNewSimulation();
  spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, objects);
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();
  startSimulation();
}

function spawnBallKinematicsWrapper() {
  prepareNewSimulation();
  spawnBallKinematics(canvas, PixelPerMeter, RulerStartX, objects);
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();
  startSimulation();
}

function spawnBallForcesWrapper() {
  prepareNewSimulation();
  spawnBallForces(canvas, PixelPerMeter, RulerStartX, objects);
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();
  startSimulation();
}

function spawnBallFrictionWrapper() {
  prepareNewSimulation();
  spawnBallFriction(canvas, PixelPerMeter, RulerStartX, objects);
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();
  startSimulation();
}

function spawnBallWorkEnergyWrapper() {
  prepareNewSimulation();
  spawnBallWorkEnergy(canvas, PixelPerMeter, RulerStartX, objects);
  simulationStartTime = performance.now();
  recordingStartTime = performance.now();
  startSimulation();
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

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.style.display = "block";
    requestAnimationFrame(() => simComplete.classList.add("visible"));
  }

}

function replaySimulation() {
  if (recordedFrames.length === 0) return;

  isReplaying = true;
  isPaused = false;
  isFinished = false;
  replayIndex = 0;

  const simComplete = document.getElementById("sim-complete");
  if (simComplete) {
    simComplete.classList.add("visible");
  }

  const slider = document.getElementById("replaySlider");
  slider.max = recordedFrames.length - 1;
  slider.value = 0;
  slider.style.display = "block";

  startReplay();
}


function startReplay() {
  if (recordedFrames.length === 0) return;

  trimIdleFrames();

  replayIndex = 0;
  isReplaying = true;
  lastReplayTime = null;
  replayStartTime = performance.now();

  document.getElementById("pauseBtn").style.display = "inline-block";

  requestAnimationFrame(replayLoop);
}

function trimIdleFrames() {
  const threshold = 0.01;

  const firstActiveIndex = recordedFrames.findIndex(frame =>
    frame.objects?.some(o =>
      Math.abs(o.vx || 0) > threshold || Math.abs(o.vy || 0) > threshold
    )
  );

  if (firstActiveIndex > 0) {
    recordedFrames = recordedFrames.slice(firstActiveIndex);
  }
}


function resetSimulation() {
  clearTimeout(replayTimer);

  isStarted = false;
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
    }, 500);
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
    pauseBtn.style.display = "none";
    pauseBtn.textContent = "Pause";
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
    objects = frame.data.map(o => ({ ...o }));
    clearCanvas();
    drawAllObjects();
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
        objects = frame.objects.map(o => ({ ...o }));
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
    } else if (!isPaused && !isFinished && isStarted) {
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
          PixelPerMeter: PixelPerMeter,
          skipCollision: true
        }, objects);
      }

      for (let o of objects) {
        applyPhysics(o, {
          currentLesson,
          collisionOnly: true
        }, objects);
      }

      const snapshot = {
        time: performance.now() - recordingStartTime, // or use a custom timer if needed
        objects: objects.map(o => ({
          ...o,
          x: o.x,
          y: o.y,
          vx: o.vx,
          vy: o.vy,
          ax: o.ax,
          ay: o.ay
        }))
      };
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
          <button id="startBtn" onclick="startSimulation()">Start</button>
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
          <button id="startBtn" onclick="startSimulation()">Start</button>
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
          <button id="startBtn" onclick="startSimulation()">Start</button>
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
          <button id="startBtn" onclick="startSimulation()">Start</button>
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
      <button id="spawnBtn" onclick="spawnBallWorkEnergyWrapper()">Spawn Ball</button>
      <button id="startBtn" onclick="startSimulation()">Start</button>
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
  window.startSimulation = startSimulation;
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

const slider = document.getElementById("replaySlider");

slider.addEventListener("input", (e) => {
  if (recordedFrames.length > 0) {
    isReplaying = false;
    isPaused = true;

    const index = parseInt(e.target.value, 10);
    replayIndex = index;
    objects = recordedFrames[replayIndex].objects.map(o => ({ ...o }));

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