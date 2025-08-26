import {
  getIsFinished, getIsReplaying, getIsStarted, getIsPaused, recordedFrames, replayIndex, replaySpeed,
  prepareNewSimulation, simulationStartTime, recordingStartTime, updateLessonUI,
  getSimulationStartTime, setSimulationStartTime, getRecordingStartTime, setRecordingStartTime, getObjects, setObjects,
  resetSimulation, setIsFinished, setIsPaused, setIsReplaying, setIsStarted, setReplaySpeed, setReplayIndex
} from "./simulationController.js";
import { drawObject, drawKinematicsObject, drawForcesObject, drawFrictionObject, drawWorkEnergyObject, drawRuler, drawVelocityArrow } from "./draw.js";
import { applyPhysics, spawnBallFreeFall, spawnBallKinematics, spawnBallForces, spawnBallFriction, spawnBallWorkEnergy } from "./physics.js";
const PixelPerMeter = 20;
const RulerStartX = 30;


let currentLesson = null;
let lastTime = performance.now();


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.getElementById("replaySpeed").addEventListener("change", (e) => {
  setReplaySpeed(parseFloat(e.target.value));
});

export function getCurrentLesson() {
    return currentLesson;
}

export function setCurrentLesson(value) {
    currentLesson = value;
}

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const width = wrapper.clientWidth;
  const height = width / 2;

  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawVelocityIfMoving(ctx, obj, PixelPerMeter, scale = 1) {
  const vx = obj.vx ?? 0;
  const vy = obj.vy ?? 0;
  const speed = Math.hypot(vx, vy);
  if (speed > 0.05) {
    drawVelocityArrow(ctx, obj, PixelPerMeter, scale);
  }
}

function spawnBallFreeFallWrapper() {
  if (!getIsStarted() && !getIsReplaying()) {
    prepareNewSimulation();
  }

  spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, getObjects());
  console.log("Spawn Ball clicked");
  if (!simulationStartTime) {
    setSimulationStartTime(performance.now());
    setRecordingStartTime(performance.now());
  }
}

function spawnBallKinematicsWrapper() {
  console.log("Spawn Ball clicked");
  if (!getIsStarted() && !getIsReplaying()) {
    prepareNewSimulation();
  }
  spawnBallKinematics(canvas, PixelPerMeter, RulerStartX, getObjects());
  if (!simulationStartTime) {
    setSimulationStartTime(performance.now());
    setRecordingStartTime(performance.now());
  }
}

function spawnBallForcesWrapper() {
  console.log("Spawn Ball clicked");
  if (!getIsStarted() && !getIsReplaying()) {
    prepareNewSimulation();
  }
  spawnBallForces(canvas, PixelPerMeter, RulerStartX, getObjects());
  if (!simulationStartTime) {
    setSimulationStartTime(performance.now());
    setRecordingStartTime(performance.now());
  }
}

function spawnBallFrictionWrapper() {
  console.log("Spawn Ball clicked");
  if (!getIsStarted() && !getIsReplaying()) {
    prepareNewSimulation();
  }
  spawnBallFriction(canvas, PixelPerMeter, RulerStartX, getObjects());
  if (!simulationStartTime) {
    setSimulationStartTime(performance.now());
    setRecordingStartTime(performance.now());
  }
}

function spawnBallWorkEnergyWrapper() {
  console.log("Spawn Ball clicked");
  if (!getIsStarted() && !getIsReplaying()) {
    prepareNewSimulation();
  }
  spawnBallWorkEnergy(canvas, PixelPerMeter, RulerStartX, getObjects());
  if (!simulationStartTime) {
    setSimulationStartTime(performance.now());
    setRecordingStartTime(performance.now());
  }
}

function clearCanvas() {
  setObjects([]);
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
}

function drawAllObjects() {
  if (!getObjects()) return;

  switch (currentLesson) {
    case "freefall":
      getObjects().forEach(obj => {
        drawObject(ctx, obj, PixelPerMeter, canvas);
        drawVelocityIfMoving(ctx, obj, PixelPerMeter, RulerStartX);
      });
      break;
    case "kinematics":
      getObjects().forEach(obj => {
        drawKinematicsObject(ctx, obj, PixelPerMeter, RulerStartX);
        drawVelocityIfMoving(ctx, obj, PixelPerMeter, RulerStartX);
      });
      break;
    case "forces":
      getObjects().forEach(obj => {
        drawForcesObject(ctx, obj, PixelPerMeter, RulerStartX);
        drawVelocityIfMoving(ctx, obj, PixelPerMeter, RulerStartX);
      });
      break;
    case "friction":
      getObjects().forEach(obj => {
        drawFrictionObject(ctx, obj, PixelPerMeter, RulerStartX);
        drawVelocityIfMoving(ctx, obj, PixelPerMeter, RulerStartX);
      });
      break;
    case "workEnergy":
      getObjects().forEach(obj => {
        drawWorkEnergyObject(ctx, obj, PixelPerMeter, canvas);
        drawVelocityIfMoving(ctx, obj, PixelPerMeter, RulerStartX);
      });
      break;
  }

  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
}

export function update() {


  if (getIsReplaying()) {
    if (recordedFrames[replayIndex]) {
      currentLesson = recordedFrames[replayIndex].lesson;
      setObjects(recordedFrames[replayIndex].objects.map(o => ({ ...o })));
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAllObjects();
    ctx.restore();

    replayIndex += replaySpeed;

    if (replayIndex >= recordedFrames.length) {
      replayIndex = recordedFrames.length - 1;
      setIsReplaying(false);
      setIsFinished(true);
    }

    if (getIsReplaying()) {
      requestAnimationFrame(update);
    }
    return;
  }

  const now = performance.now();
  let deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  deltaTime = Math.min(deltaTime, 0.05)

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

  ctx.save();

  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) {
    if (getIsReplaying() && recordedFrames[replayIndex]) {
      const replayTime = recordedFrames[replayIndex].time / 1000;
      timerDisplay.innerText = `${replayTime.toFixed(2)} s`;
    } else if (getIsStarted() && !getIsPaused() && !getIsFinished() && simulationStartTime !== null) {
      const elapsed = (performance.now() - simulationStartTime) / 1000;
      timerDisplay.innerText = `${elapsed.toFixed(2)} s`;
    }
  }

  if (!currentLesson) {
    ctx.restore();
  } else if (!getIsPaused() && !getIsFinished() && getIsStarted()) {
    const gravity = parseFloat(document.getElementById("gravity")?.value || 9.8);
    const restitution = parseFloat(document.getElementById("restitution")?.value || 0.8);
    const friction = parseFloat(document.getElementById("friction")?.value || 0);
    const currentObjects = getObjects();

    for (let o of currentObjects) {
      applyPhysics(o, {
        gravity,
        restitution,
        canvasHeight: canvas.height,
        deltaTime,
        currentLesson,
        friction,
        PixelPerMeter: PixelPerMeter,
        skipCollision: true
      }, getObjects());
    }

    for (let o of currentObjects) {
      applyPhysics(o, {
        currentLesson,
        collisionOnly: true
      }, getObjects());
    }

    if (!getIsPaused() && getIsStarted() &&
      currentLesson &&
      currentObjects.some(o => o.vx !== 0 || o.vy !== 0 || o.ax !== 0 || o.ay !== 0)) {
      const snapshot = {
        time: performance.now() - recordingStartTime,
        lesson: currentLesson,
        objects: currentObjects.map(o => ({
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
  }

  drawAllObjects();
  ctx.restore();
  requestAnimationFrame(update);
}

function switchLesson(lesson) {
  resetSimulation();
  currentLesson = lesson;
  localStorage.setItem("currentLesson", lesson);
  clearCanvas();
  updateLessonUI(currentLesson);

  // Update active button
  document.querySelectorAll('#nav button').forEach(btn => {
    const isActive = btn.getAttribute('data-lesson') === lesson;
    btn.classList.toggle('active', isActive);
  });

  requestAnimationFrame(update);
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
    setIsReplaying(false);
    setIsPaused(true);

    const index = parseInt(e.target.value, 10);
    setReplayIndex(index);

    let newObjects = recordedFrames[replayIndex].objects.map(o => ({ ...o }));
    setObjects(newObjects);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

    for (const obj of newObjects) {
      switch (currentLesson) {
        case "freefall":
          drawObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityIfMoving(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "kinematics":
          drawKinematicsObject(ctx, obj, PixelPerMeter);
          drawVelocityIfMoving(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "forces":
          drawForcesObject(ctx, obj, PixelPerMeter);
          drawVelocityIfMoving(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "friction":
          drawFrictionObject(ctx, obj, PixelPerMeter);
          drawVelocityIfMoving(ctx, obj, PixelPerMeter, 0.5);
          break;
        case "workEnergy":
          drawWorkEnergyObject(ctx, obj, PixelPerMeter, canvas);
          drawVelocityIfMoving(ctx, obj, PixelPerMeter, 0.5);
          break;
      }
    }
  }
});


const desc = document.getElementById("lesson-description");
desc.innerHTML = "<em>Click a lesson button to start!</em>";



update();


export {
  drawAllObjects, spawnBallFreeFallWrapper, spawnBallKinematicsWrapper, spawnBallForcesWrapper, spawnBallFrictionWrapper,
  spawnBallWorkEnergyWrapper, clearCanvas, switchLesson, ctx, canvas, PixelPerMeter, RulerStartX, currentLesson
};