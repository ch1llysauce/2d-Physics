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
    } = options;

    // Only apply motion (Stage 1)
    if (skipCollision) {
        // Gravity (not for kinematics)
        if (currentLesson !== "kinematics" && currentLesson !== "forces" && !obj.restingOn) {
            obj.vy += (obj.gravity ?? gravity) * deltaTime;
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
                obj.vy += gravity * deltaTime;
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

            if(obj.isOnGround) {
                const normalForce = mass * gravityVal;
                const frictionForce = mu * normalForce;
                const frictionAccel = frictionForce / mass;

                if (Math.abs(obj.vx) < frictionAccel * deltaTime) {
                    obj.vx = 0;
                } else {
                    obj.vx -= Math.sign(obj.vx) * frictionAccel * deltaTime;
                }
            }

            if(obj.vy !== 0){
                obj.vy += gravityVal * deltaTime;
            }
        }

        // Position update
        obj.x += obj.vx * deltaTime;
        obj.y += obj.vy * deltaTime;

        // Floor collision
        if (currentLesson !== "kinematics" && (currentLesson !== "forces" || obj.useGravity === true)) {
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
    if (collisionOnly && obj.radius) {
        handleCircleCollisions(obj, allObjects, { restitution });
    }

    updateRestingStatus(obj);
}

function handleVerticalStackCollision(obj, other) {
    const alignedX = Math.abs(obj.x - other.x) < 2;
    const verticalProximity = Math.abs(obj.y - other.y) < (obj.radius + other.radius) * 1.1;

    if (!alignedX || !verticalProximity) return false;

    const bounce = Math.min(obj.restitution ?? 0.8, other.restitution ?? 0.8);
    const v1 = obj.vy;
    const v2 = other.vy;

    const relativeVelocity = v1 - v2;
    if (Math.abs(relativeVelocity) < 0.2 && Math.abs(v1) < 0.2 && Math.abs(v2) < 0.2) {
        obj.vy = 0;
        other.vy = 0;
        obj.restingOn = other;
        return true;
    }

    obj.vy = -v2 * bounce;
    other.vy = -v1 * bounce;
    return true;

}

function updateRestingStatus(obj) {
    if (!obj.restingOn) return;

    const dx = obj.x - obj.restingOn.x;
    const dy = obj.y - obj.restingOn.y;
    const dist = Math.hypot(dx, dy);
    const combinedRadius = (obj.radius ?? obj.h / 2) + (obj.restingOn.radius ?? obj.restingOn.h / 2);

    if (dist > combinedRadius + 1) {
        obj.restingOn = null;
    }
}

function handleCircleCollisions(obj, allObjects, options = {}) {
    const restitution = options.restitution ?? 0.8;

    for (let other of allObjects) {
        if (other === obj || !other.radius) continue;

        const dx = other.x - obj.x;
        const dy = other.y - obj.y;
        const dist = Math.hypot(dx, dy);
        const minDist = obj.radius + other.radius;

        if (dist <= minDist) {
            // 1. Resolve overlap
            const overlap = minDist - dist;
            let nx, ny;
            if (dist === 0) {
                const angle = Math.random() * 2 * Math.PI;
                nx = Math.cos(angle);
                ny = Math.sin(angle);
            } else {
                nx = dx / dist;
                ny = dy / dist;
            }

            obj.x -= nx * overlap / 2;
            obj.y -= ny * overlap / 2;
            other.x += nx * overlap / 2;
            other.y += ny * overlap / 2;

            // 2. Special vertical stack handling
            if (handleVerticalStackCollision(obj, other)) {
                continue;
            }

            // 3. Relative velocity along normal
            const vxRel = obj.vx - other.vx;
            const vyRel = obj.vy - other.vy;
            const relVel = vxRel * nx + vyRel * ny;

            if (relVel > 0) continue;

            const bounce = Math.min(obj.restitution ?? restitution, other.restitution ?? restitution);
            const impulse = -(1 + bounce) * relVel / 2;

            obj.vx += impulse * nx;
            obj.vy += impulse * ny;
            other.vx -= impulse * nx;
            other.vy -= impulse * ny;
        }
    }
}


export function spawnBallFreeFall(canvas, PixelPerMeter, RulerStartX, objects, x = null, y = null, vx = null, vy = null) {
    const velInput = document.getElementById("initVel");
    const heightInput = document.getElementById("initHeight");
    const initXInput = document.getElementById("initX");
    const gravityInput = document.getElementById("gravity");
    const restitutionInput = document.getElementById("restitution");

    const gravityVal = gravityInput ? parseFloat(gravityInput.value) : 9.8;
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
    y = y !== null ? y : canvas.height - (initYMeters * PixelPerMeter);
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
    y = Math.min(canvas.height - radius, Math.max(radius, y));

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
    y = y !== null ? y : canvas.height - (initYMeters * PixelPerMeter);
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
