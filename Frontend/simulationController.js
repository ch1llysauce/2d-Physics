import {
    drawAllObjects, spawnBallFreeFallWrapper, spawnBallKinematicsWrapper,
    spawnBallForcesWrapper, spawnBallFrictionWrapper, spawnBallWorkEnergyWrapper,
    clearCanvas, update, ctx, canvas, PixelPerMeter, RulerStartX, getCurrentLesson, setCurrentLesson
} from "./main.js";
import { drawRuler, drawObject, drawForcesObject, drawKinematicsObject, drawFrictionObject, drawWorkEnergyObject, drawVelocityArrow } from "./draw.js";


export let recordedFrames = [];
export let replayIndex = 0;
export let replaySpeed = 1;
export let simulationStartTime = null;
export let recordingStartTime = performance.now();
export let objects = [];


let isFinished = false;
let isReplaying = false;
let isStarted = false;
let isPaused = false;
let filteredFrames = [];
let lastReplayTime = null;
let replayStartTime = 0;
let totalElapsedTime = 0;
let replayTimer = null;
let pauseStartTime = 0;
let totalPausedDuration = 0;
let pausedTimeOffset = 0;

const pauseBtn = document.getElementById("pauseBtn");
if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
        isPaused = !isPaused;

        if (isPaused) {
            pauseBtn.textContent = "Resume";
            pauseBtn.classList.add("pause-red");
        } else {
            pauseBtn.textContent = "Pause";
            pauseBtn.classList.remove("pause-red");
            requestAnimationFrame(replayLoop);
        }
    });
}

//Internal functions
function drawCurrentReplayFrame() {
    const frame = recordedFrames[replayIndex];
    if (frame) {
        setObjects(frame.objects.map(o => ({ ...o })));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);
        for (const obj of objects) {
            drawObject(ctx, obj);
        }

        const slider = document.getElementById("replaySlider");
        if (slider) slider.value = replayIndex;
    }
}

function trimIdleFrames() {
    const threshold = 0.01;

    const firstActiveIndex = recordedFrames.findIndex(frame =>
        frame.objects?.some(o =>
            Math.abs(o.vx || 0) > threshold || Math.abs(o.vy || 0) > threshold
        )
    );

    if (firstActiveIndex > 0) {
        return recordedFrames.slice(firstActiveIndex);
    }
    return recordedFrames;
}

function startReplay() {
    if (recordedFrames.length === 0) return;

    filteredFrames = trimIdleFrames();

    replayIndex = 0;
    isReplaying = true;
    lastReplayTime = null;
    replayStartTime = performance.now();

    document.getElementById("pauseBtn").style.display = "inline-block";

    requestAnimationFrame(replayLoop);
}

function wireButton(id, handler) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", handler);
}


function replayLoop(timestamp) {
    if (!isReplaying || isPaused) return;

    if (!lastReplayTime) lastReplayTime = timestamp;

    const effectiveStartTime = replayStartTime + totalPausedDuration;
    const currentTime = (timestamp - effectiveStartTime) * replaySpeed;


    while (
        replayIndex < filteredFrames.length - 1 &&
        filteredFrames[replayIndex + 1].time <= currentTime
    ) {
        replayIndex++;

        const slider = document.getElementById("replaySlider");
        if (slider) slider.value = replayIndex;
    }

    if (replayIndex >= filteredFrames.length && currentTime >= filteredFrames[filteredFrames.length - 1]?.time) {
        replayIndex = filteredFrames.length - 1;
        isReplaying = false;
        return;

    }

    let frame = filteredFrames[replayIndex];
    setObjects(frame.objects.map(o => ({ ...o })));

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

    setCurrentLesson(frame.lesson);
    drawAllObjects();

    const slider = document.getElementById("replaySlider");
    if (slider) {
        slider.addEventListener("input", handleSliderScrub);
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

function getSimulationStartTime() {
    return simulationStartTime;
}
function setSimulationStartTime(value) {
    simulationStartTime = value;
}

function getRecordingStartTime() {
    return recordingStartTime;
}
function setRecordingStartTime(value) {
    recordingStartTime = value;
}


function getIsStarted() {
    return isStarted;
}

function setIsStarted(value) {
    isStarted = value;
}

function getIsPaused() {
    return isPaused;
}

function setIsPaused(value) {
    isPaused = value;
}

function getIsFinished() {
    return isFinished;
}

function setIsFinished(value) {
    isFinished = value;
}

function getIsReplaying() {
    return isReplaying;
}

function setIsReplaying(value) {
    isReplaying = value;
}

export function getObjects() {
    return objects;
}

export function setObjects(newObjects) {
    objects = newObjects;
}
//Simulation control functions
export function startSimulation() {
    if (isStarted || isReplaying || isFinished || getObjects().length === 0) return;

    console.log("Starting simulation. Objects length:", getObjects().length);

    isStarted = true;
    isPaused = false;
    simulationStartTime = performance.now();
    recordingStartTime = performance.now();

    const startBtn = document.getElementById("startBtn");
    startBtn.textContent = "Pause";


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

    requestAnimationFrame(update);
}

export function prepareNewSimulation() {
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

export function finishSimulation() {
    isFinished = true;
    isPaused = true;

    const spawnBtn = document.getElementById("spawnBtn");
    if (spawnBtn) {
        spawnBtn.disabled = true;
        spawnBtn.classList.add("opacity-50", "cursor-not-allowed");
    }

    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add("opacity-50", "cursor-not-allowed");
        startBtn.classList.remove("pause-red");
        startBtn.textContent = "Start";
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

export function resetSimulation() {
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

    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add("opacity-50", "cursor-not-allowed");
        startBtn.classList.remove("pause-red");
        startBtn.textContent = "Start";
    }

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
        pauseBtn.style.display = "none";
        pauseBtn.textContent = "Pause";
    }
}

export function replaySimulation() {
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

export function setReplaySpeed(value) {
    replaySpeed = value;
}

export function setReplayIndex(value) {
    replayIndex = value;
}

export function togglePause() {

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
            pauseStartTime = performance.now();
        } else {
            const now = performance.now();
            totalPausedDuration += (now - pauseStartTime);
            lastReplayTime = null;
            requestAnimationFrame(replayLoop);
        }
    } else {
        if (!isPaused) {
            requestAnimationFrame(update);
        }
    }
}

export function toggleSimulationPause(getObjects) {
    const startBtn = document.getElementById("startBtn");
    console.log("Clicked!");

    if (!isStarted && !isReplaying && !isFinished && getObjects().length > 0) {
        startSimulation();
        startBtn.textContent = "Pause";
        return;
    }

    isPaused = !isPaused;
    startBtn.textContent = isPaused ? "Resume" : "Pause";
    startBtn.classList.toggle("pause-red", isPaused);
    startBtn.style.display = "inline-block";

    if (isPaused) {
        pauseStartTime = performance.now();
    } else {
        const now = performance.now();
        const pausedDuration = now - pauseStartTime;
        totalPausedDuration += pausedDuration;

        recordingStartTime += pausedDuration;

        requestAnimationFrame(update);
    }
}

//UI handlers
export function handleSliderScrub(e) {
    let index = parseInt(e.target.value);
    if (isNaN(index) || index < 0 || index >= recordedFrames.length) return;

    while (index < recordedFrames.length && recordedFrames[index].paused) {
        index++;
    }

    replayIndex = index;
    isReplaying = true;
    isPaused = true;

    const currentScrubTime = recordedFrames[replayIndex]?.time ?? 0;
    replayStartTime = performance.now() - currentScrubTime / replaySpeed;
    lastReplayTime = null;

    const frame = recordedFrames[replayIndex];
    let newObjects = frame.objects.map(o => ({ ...o }));
    setObjects(newObjects);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRuler(ctx, canvas, PixelPerMeter, RulerStartX);

    for (const obj of newObjects) {
        switch (getCurrentLesson()) {
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

    if (replayIndex === recordedFrames.length - 1) {
        isReplaying = false;
        isPaused = true;
    }

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
        const atLastFrame = replayIndex === recordedFrames.length - 1;
        pauseBtn.disabled = atLastFrame;

        if (!isPaused) {
            pauseBtn.textContent = "Pause";
            pauseBtn.classList.remove("pause-red");
        } else {
            pauseBtn.textContent = "Resume";
            pauseBtn.classList.add("pause-red");
        }
    }

    const timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay && recordedFrames[replayIndex]?.time != null) {
        timerDisplay.innerText = `${(recordedFrames[replayIndex].time / 1000).toFixed(2)} s`;
    }

}

export function updateLessonUI(currentLesson) {
    const desc = document.getElementById("lesson-description");
    const controls = document.getElementById("controls");
    controls.innerHTML = ''; // Clear previous controls

    switch (currentLesson) {
        case "freefall":
            desc.innerHTML = "This lesson demonstrates the effect of gravity on objects.";
            controls.innerHTML = `
                <div id="freefall-controls">
                <button id="spawnBtn">Spawn Ball</button>
                <button id="startBtn">Start</button>
                <button id="clearBtn">Clear</button>
                <button id="finishBtn">Finish</button>
                <button id="replayBtn">Replay</button>
                <button id="resetBtn">Reset</button>
                <br/><br/>
                Gravity: <input id="gravity" type="number" value="9.8" step="0.1" style="width: 60px" />
                Initial Velocity: <input id="initVel" type="number" value="0" step="0.5" style="width: 60px" />
                <br/><br/>
                Initial Height (Y): <input id="initHeight" type="number" value="10" step="1" style="width: 60px" />
                Initial X Position: <input id="initX" type="number" value="0" step="1" style="width: 60px" />
                Restitution (0-1): <input id="restitution" type="number" value="0.8" step="0.1" min="0" max="1" style="width: 60px" />
                </div>
            `;
            wireButton("spawnBtn", spawnBallFreeFallWrapper);
            break;

        case "kinematics":
            desc.innerHTML = "This lesson explores uniform motion and accelerated motion.";
            controls.innerHTML = `
                <div id="kinematics-controls">
                <button id="spawnBtn">Spawn Ball</button>
                <button id="startBtn">Start</button>
                <button id="clearBtn">Clear</button>
                <button id="finishBtn">Finish</button>
                <button id="replayBtn">Replay</button>
                <button id="resetBtn">Reset</button>
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
            wireButton("spawnBtn", spawnBallKinematicsWrapper);
            break;

        case "forces":
            desc.innerHTML = "This lesson demonstrates Newton's Second Law with forces and acceleration.";
            controls.innerHTML = `
                <div id="forces-controls">
                <button id="spawnBtn">Spawn Ball</button>
                <button id="startBtn">Start</button>
                <button id="clearBtn">Clear</button>
                <button id="finishBtn">Finish</button>
                <button id="replayBtn">Replay</button>
                <button id="resetBtn">Reset</button>
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
            wireButton("spawnBtn", spawnBallForcesWrapper);
            break;

        case "friction":
            desc.innerHTML = "This lesson illustrates the role of friction on object motion.";
            controls.innerHTML = `
                <div id="friction-controls">
                <button id="spawnBtn">Spawn Ball</button>
                <button id="startBtn">Start</button>
                <button id="clearBtn">Clear</button>
                <button id="finishBtn">Finish</button>
                <button id="replayBtn">Replay</button>
                <button id="resetBtn">Reset</button>
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
            wireButton("spawnBtn", spawnBallFrictionWrapper);
            break;

        case "workEnergy":
            desc.innerHTML = "This lesson explores energy conservation and work-energy principles.";
            controls.innerHTML = `
                <div id="work-energy-controls">
                <button id="spawnBtn">Spawn Ball</button>
                <button id="startBtn">Start</button>
                <button id="clearBtn">Clear</button>
                <button id="finishBtn">Finish</button>
                <button id="replayBtn">Replay</button>
                <button id="resetBtn">Reset</button>
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
            wireButton("spawnBtn", spawnBallWorkEnergyWrapper);
            break;
    }

    // Common button wiring
    wireButton("startBtn", () => toggleSimulationPause(() => objects));
    wireButton("clearBtn", clearCanvas);
    wireButton("finishBtn", finishSimulation);
    wireButton("replayBtn", replaySimulation);
    wireButton("resetBtn", resetSimulation);

    // Optional download buttons if you want to include them
    wireButton("downloadReplayBtn", downloadReplay);
    wireButton("downloadVideoBtn", downloadReplayAsVideo);

    // Disable replay button initially
    const replayBtn = document.getElementById("replayBtn");
    if (replayBtn) {
        replayBtn.disabled = true;
        replayBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
}

//Download functions
export function downloadReplay() {
    if (recordedFrames.length === 0) return;

    const blob = new Blob([JSON.stringify(recordedFrames)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "replay.json";
    a.click();

    URL.revokeObjectURL(url);
}

export function downloadReplayAsVideo(playbackSpeed = 1.0) {
    if (recordedFrames.length === 0) return;

    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    let hasRenderedLastFrame = false;

    recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
        console.log("Recording stopped");
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "replay.webm";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    let index = 0;
    let startTime = null;

    function renderNextFrame(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) * playbackSpeed;

        while (index < recordedFrames.length - 1 && recordedFrames[index + 1].time <= elapsed) {
            index++;
        }

        const frame = recordedFrames[index];
        currentLesson = frame.lesson;
        setObjects(frame.objects.map(o => ({ ...o })));

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawAllObjects();

        if (index < recordedFrames.length - 1) {
            requestAnimationFrame(renderNextFrame);
        } else if (!hasRenderedLastFrame) {
            hasRenderedLastFrame = true;
            requestAnimationFrame(() => {
                const lastFrame = recordedFrames[recordedFrames.length - 1];
                currentLesson = lastFrame.lesson;
                setObjects(frame.objects.map(o => ({ ...o })));
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawAllObjects();

                setTimeout(() => recorder.stop(), 100);
            });
        }
    }

    setTimeout(() => {
        recorder.start();
        console.log("Recording started");
        requestAnimationFrame(renderNextFrame);
    }, 100);
}

export {
    getSimulationStartTime,
    setSimulationStartTime,
    getRecordingStartTime,
    setRecordingStartTime,
    getIsFinished,
    getIsPaused,
    getIsReplaying,
    getIsStarted,
    setIsFinished,
    setIsPaused,
    setIsReplaying,
    setIsStarted
};