export function applyPhysics(obj, options = {}, allObjects = []) {
    const {
        gravity = 9.8,
        restitution = 0.8,
        canvasHeight = 600,
        deltaTime = 1 / 60,
        currentLesson = null,
        friction = 0,
        skipCollision = false,
        collisionOnly = false,
        PixelPerMeter = 20
    } = options;

    const scaledGravity = (obj.gravity ?? gravity) * PixelPerMeter;

    // Only apply motion (Stage 1)
    if (skipCollision) {
        // Gravity (not for kinematics)
        if (currentLesson !== "kinematics" && currentLesson !== "forces" && !obj.restingOn) {
            if (!obj.restingOn) {
                obj.vy += scaledGravity * deltaTime;
            }
        }

        // Freefall logic
        if (currentLesson === "freefall") {
            obj.vx = 0;
        }

        // Kinematics logic
        if (currentLesson === "kinematics") {
            obj.vx += (obj.accelX ?? 0) * deltaTime;
            obj.vy += (obj.accelY ?? 0) * deltaTime;
        }

        //Forces logic
        if (currentLesson === "forces") {
            const { ax, ay } = getAccelerationFromForce(obj);

            obj.vx += ax * deltaTime;
            obj.vy += ay * deltaTime;

            if (obj.useGravity === true) {
                obj.vy += gravity * PixelPerMeter * deltaTime;

                const radiusOrHalfHeight = obj.radius || obj.h / 2;
                const bottom = obj.y + radiusOrHalfHeight;

                if (bottom > canvasHeight) {
                    obj.y = canvasHeight - radiusOrHalfHeight;
                    obj.vy *= -(obj.restitution ?? restitution);

                    if (Math.abs(obj.vy) < 0.2) {
                        obj.vy = 0;
                    }
                }
            }
        }

        // Friction logic
        if (currentLesson === "friction") {
            const gravityVal = obj.gravity ?? gravity;
            const mu = obj.friction ?? friction;
            const mass = obj.mass ?? 1;

            const radiusOrHalfHeight = obj.radius || obj.h / 2;
            const bottom = obj.y + radiusOrHalfHeight;

            if (bottom >= canvasHeight - 1) {
                obj.isOnGround = true;
            }

            if (obj.isOnGround) {
                const normalForce = mass * gravityVal;
                const frictionForce = mu * normalForce;
                const frictionAccel = frictionForce / mass;

                if (Math.abs(obj.vx) < frictionAccel * deltaTime) {
                    obj.vx = 0;
                } else {
                    obj.vx -= Math.sign(obj.vx) * frictionAccel * deltaTime;
                }
            }

            if (obj.vy !== 0) {
                obj.vy += gravityVal * PixelPerMeter * deltaTime;
            }
        }

        // Work-Energy logic
        if (currentLesson === "workEnergy") {
            if (!obj.restingOn) {
                obj.vy += scaledGravity * deltaTime;
            }
        }

        // Position update
        obj.x += obj.vx * deltaTime;
        obj.y += obj.vy * deltaTime;

        // Floor collision
        if (!["kinematics", "forces"].includes(currentLesson)) {
            const radiusOrHalfHeight = obj.radius || obj.h / 2;
            const bottom = obj.y + radiusOrHalfHeight;

            if (bottom > canvasHeight) {
                obj.y = canvasHeight - radiusOrHalfHeight;
                obj.vy *= -(obj.restitution ?? restitution);

                if (Math.abs(obj.vy) < 0.2) {
                    obj.vy = 0;
                }
            }
        }

        return;
    }

    // Only apply collisions (Stage 2)
    if (collisionOnly && obj.radius && !["kinematics", "forces"].includes(currentLesson)) {
        handleGroundCollision(obj, canvasHeight, restitution);
        handleCircleCollisions(obj, allObjects, { restitution });
    }

    updateRestingStatus(obj);
}

function handleGroundCollision(obj, canvasHeight, restitution = 0.8) {
    const radius = obj.radius || obj.h / 2;
    const bottom = obj.y + radius;

    if (bottom >= canvasHeight) {
        obj.y = canvasHeight - radius;

        if (Math.abs(obj.vy) < 0.5) {
            obj.vy = 0;
            obj.restingOn = { ground: true };
        } else {
            obj.vy *= -(obj.restitution ?? restitution);
        }

        return true;
    }

    return false;
}

function updateRestingStatus(obj) {
    if (!obj.restingOn) return;

    const yGap = Math.abs(obj.y - obj.restingOn.y);
    const targetGap = (obj.radius ?? obj.h / 2) + (obj.restingOn.radius ?? obj.restingOn.h / 2);

    if (yGap > targetGap + 1) {
        obj.restingOn = null;
    }

}

function handleCircleCollisions(obj, allObjects, options = {}) {
    const restitution = options.restitution ?? 0.8;
    const skipIfOnGround = options.skipIfOnGround ?? false;

    for (const other of allObjects) {
        if (obj === other || !other.radius) continue;

        const dx = other.x - obj.x;
        const dy = other.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = (obj.radius ?? obj.h / 2) + (other.radius ?? other.h / 2);

        if (distance < minDist) {
            const overlap = minDist - distance;
            const nx = dx / distance;
            const ny = dy / distance;

            obj.x -= nx * overlap / 2;
            obj.y -= ny * overlap / 2;
            other.x += nx * overlap / 2;
            other.y += ny * overlap / 2;

            const rvx = other.vx - obj.vx;
            const rvy = other.vy - obj.vy;
            const relVel = rvx * nx + rvy * ny;

            if (relVel > 0) continue;

            const bounce = Math.min(obj.restitution ?? restitution, other.restitution ?? restitution);
            const impulse = -(1 + bounce) * relVel / 2;

            // 🛑 Skip vertical bounce if this obj already bounced on the ground
            if (skipIfOnGround && Math.abs(ny) > 0.8) continue;

            obj.vx -= impulse * nx;
            obj.vy -= impulse * ny;
            other.vx += impulse * nx;
            other.vy += impulse * ny;
        }
    }
}



export function spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null) {
    const velInput = document.getElementById("initVel");
    const heightInput = document.getElementById("initHeight");
    const initXInput = document.getElementById("initX");
    const gravityInput = document.getElementById("gravity");
    const restitutionInput = document.getElementById("restitution");

    const radius = 20;

    const gravityVal = gravityInput ? parseFloat(gravityInput.value) : 9.8;
    const restitutionVal = restitutionInput ? parseFloat(restitutionInput.value) : 0.8;

    vx = vx !== null ? vx : 0;
    vy = vy !== null ? vy : (velInput ? parseFloat(velInput.value) : 0);

    const heightMeters = heightInput ? parseFloat(heightInput.value) : 2.5;
    y = y !== null ? y : canvas.height - (heightMeters * PixelPerMeter) - radius;
    y = Math.max(0, Math.min(canvas.height - 20, y)); // clamp to canvas bounds 

    const xMeters = initXInput ? parseFloat(initXInput.value) : 0;
    x = x !== null ? x : RulerStartX + (xMeters * PixelPerMeter);
    x = Math.max(20, Math.min(canvas.width - 20, x)); // clamp to canvas bounds

    objects.push({ x, y, vx, vy, radius, gravity: gravityVal, restitution: restitutionVal });
}

export function spawnBallKinematics(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null,
    accelX = null, accelY = null) {

    const initXInput = document.getElementById("initX");
    const initYInput = document.getElementById("initY");
    const initVelXInput = document.getElementById("initVelX");
    const initVelYInput = document.getElementById("initVelY");
    const accelXInput = document.getElementById("accelX");
    const accelYInput = document.getElementById("accelY");

    const radius = 20;

    vx = vx !== null ? vx : (initVelXInput ? parseFloat(initVelXInput.value) * PixelPerMeter : 0);
    vy = vy !== null ? vy : (initVelYInput ? -parseFloat(initVelYInput.value) * PixelPerMeter : 0);
    accelX = accelX !== null ? accelX : (accelXInput ? parseFloat(accelXInput.value) * PixelPerMeter : 0);
    accelY = accelY !== null ? accelY : (accelYInput ? -parseFloat(accelYInput.value) * PixelPerMeter : 0);

    const initXMeters = initXInput ? parseFloat(initXInput.value) : 0;
    x = x !== null ? x : RulerStartX + (initXMeters * PixelPerMeter);
    x = Math.max(radius, Math.min(canvas.width - radius, x));

    const initYMeters = initYInput ? parseFloat(initYInput.value) : 2.5;
    y = y !== null ? y : canvas.height - (initYMeters * PixelPerMeter) - radius;
    y = Math.min(canvas.height - radius, Math.max(radius, y));

    objects.push({ x, y, vx, vy, radius, accelX, accelY });
}

export function spawnBallForces(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null,
    force = null, mass = null, angle = null, useGravity = null) {
    const forceInput = document.getElementById("force");
    const massInput = document.getElementById("mass");
    const angleInput = document.getElementById("angle");

    const initVelXInput = document.getElementById("initVelX");
    const initVelYInput = document.getElementById("initVelY");
    const initXInput = document.getElementById("initX");
    const initYInput = document.getElementById("initY");
    const useGravityInput = document.getElementById("useGravity");

    const radius = 20;

    vx = vx !== null ? vx : (initVelXInput ? parseFloat(initVelXInput.value) * PixelPerMeter : 0);
    vy = vy !== null ? vy : (initVelYInput ? -parseFloat(initVelYInput.value) * PixelPerMeter : 0);

    const initXMeters = initXInput ? parseFloat(initXInput.value) : 0;
    x = x !== null ? x : RulerStartX + (initXMeters * PixelPerMeter);
    x = Math.max(radius, Math.min(canvas.width - radius, x));

    const initYMeters = initYInput ? parseFloat(initYInput.value) : 2.5;
    y = y !== null ? y : canvas.height - (initYMeters * PixelPerMeter);
    y = Math.min(canvas.height - radius, Math.max(radius, y)) - radius;

    objects.push({
        x,
        y,
        vx,
        vy,
        radius,
        force: force !== null ? force : (forceInput ? parseFloat(forceInput.value) : 10),
        mass: mass !== null ? mass : (massInput ? parseFloat(massInput.value) : 1),
        angle: angle !== null ? angle : (angleInput ? parseFloat(angleInput.value) * Math.PI / 180 : 0),
        useGravity: useGravity !== null && useGravity !== undefined
            ? useGravity
            : (useGravityInput ? useGravityInput.checked : true)


    });
}

export function spawnBallFriction(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null,
    mass = null, friction = null) {

    const massInput = document.getElementById("mass");
    const frictionInput = document.getElementById("friction");
    const gravityInput = document.getElementById("gravity");

    const initVelXInput = document.getElementById("initVelX");
    const initVelYInput = document.getElementById("initVelY");
    const initXInput = document.getElementById("initX");
    const initYInput = document.getElementById("initY");

    const gravityVal = gravityInput ? parseFloat(gravityInput.value) : 9.8;

    const radius = 20;

    vx = vx !== null ? vx : (initVelXInput ? parseFloat(initVelXInput.value) * PixelPerMeter : 0);
    vy = vy !== null ? vy : (initVelYInput ? -parseFloat(initVelYInput.value) * PixelPerMeter : 0);

    const initXMeters = initXInput ? parseFloat(initXInput.value) : 0;
    x = x !== null ? x : RulerStartX + (initXMeters * PixelPerMeter);
    x = Math.max(radius, Math.min(canvas.width - radius, x));

    const initYMeters = initYInput ? parseFloat(initYInput.value) : 2.5;
    y = y !== null ? y : canvas.height - (initYMeters * PixelPerMeter) - radius;
    y = Math.min(canvas.height - radius, Math.max(radius, y));

    objects.push({
        x,
        y,
        vx,
        vy,
        radius,
        mass: mass !== null ? mass : (massInput ? parseFloat(massInput.value) : 1),
        gravity: gravityVal,
        friction: friction !== null ? friction : (frictionInput ? parseFloat(frictionInput.value) : 0.1)
    });
}

export function spawnBallWorkEnergy(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null) {

    const massInput = document.getElementById("mass");
    const gravityInput = document.getElementById("gravity");
    const initXInput = document.getElementById("initX");
    const heightInput = document.getElementById("initHeight");
    const restitutionInput = document.getElementById("restitution");
    const initVelXInput = document.getElementById("initVelX");
    const initVelYInput = document.getElementById("initVelY");
    const radius = 20;

    const gravityVal = gravityInput ? parseFloat(gravityInput.value) : 9.8;
    const restitutionVal = restitutionInput ? parseFloat(restitutionInput.value) : 0.8;

    const xMeters = initXInput ? parseFloat(initXInput.value) : 0;
    x = x !== null ? x : RulerStartX + (xMeters * PixelPerMeter);
    x = Math.max(radius, Math.min(canvas.width - radius, x)); // clamp to canvas bounds

    const heightMeters = heightInput ? parseFloat(heightInput.value) : 2.5;
    y = y !== null ? y : canvas.height - (heightMeters * PixelPerMeter) - radius;
    y = Math.max(radius, Math.min(canvas.height - radius, y)); // clamp to canvas bounds

    vx = vx !== null ? vx : (initVelXInput ? parseFloat(initVelXInput.value) * PixelPerMeter : 0);
    vy = vy !== null ? vy : (initVelYInput ? -parseFloat(initVelYInput.value) * PixelPerMeter : 0);

    objects.push({
        x,
        y,
        vx,
        vy,
        radius,
        mass: massInput ? parseFloat(massInput.value) : 1,
        gravity: gravityVal,
        restitution: restitutionVal
    });
}

export function getAccelerationFromForce(obj) {
    const mass = obj.mass ?? 1;
    const force = obj.force ?? 0;

    if (!Number.isFinite(force) || !Number.isFinite(mass) || mass <= 0) {
        return { ax: 0, ay: 0 }; // Prevent divide-by-zero or NaNs
    }

    const angle = obj.angle ?? 0;
    const acceleration = force / mass;

    return {
        ax: acceleration * Math.cos(angle),
        ay: -acceleration * Math.sin(angle),
    };
}
