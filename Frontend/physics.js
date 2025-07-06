export function applyPhysics(obj, options = {}, allObjects = []) {
    const {
        gravity = 9.8,
        restitution = 0.8,
        canvasHeight = 600,
        deltaTime = 1 / 60,
        currentLesson = null,
        friction = 0,
        skipCollision = false,
        collisionOnly = false
    } = options;

    // Only apply motion (Stage 1)
    if (skipCollision) {
        // Gravity (not for kinematics)
        if (currentLesson !== "kinematics" && !obj.restingOn) {
            obj.vy += (obj.gravity ?? gravity) * deltaTime;
        }

        // Freefall logic
        if (currentLesson === "freefall") {
            obj.vx = 0;
        }

        // Friction logic
        if (currentLesson === "friction") {
            obj.vx *= 1 - friction * deltaTime;
            obj.vy *= 1 - friction * deltaTime;
        }

        // Position update
        obj.x += obj.vx * deltaTime;
        obj.y += obj.vy * deltaTime;

        // Floor collision
        const radiusOrHalfHeight = obj.radius || obj.h / 2;
        const bottom = obj.y + radiusOrHalfHeight;

        if (bottom > canvasHeight) {
            obj.y = canvasHeight - radiusOrHalfHeight;
            obj.vy *= -(obj.restitution ?? restitution);

            
            if (Math.abs(obj.vy) < 0.2) {
                obj.vy = 0;
            }
        }

        return;
    }

    // Only apply collisions (Stage 2)
    if (collisionOnly && obj.radius) {
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

                // 2. Check for vertical stack case
                if (handleVerticalStackCollision(obj, other)) {
                    continue;
                }

                // 3. Relative velocity along normal
                const vxRel = obj.vx - other.vx;
                const vyRel = obj.vy - other.vy;
                const relVel = vxRel * nx + vyRel * ny;

                if (relVel > 0) continue; // already separating

                // 4. Compute impulse
                const bounce = Math.min(obj.restitution ?? 0.8, other.restitution ?? 0.8);
                const impulse = -(1 + bounce) * relVel / 2;

                // 5. Apply impulse
                obj.vx += impulse * nx;
                obj.vy += impulse * ny;
                other.vx -= impulse * nx;
                other.vy -= impulse * ny;
            }
        }
    }

    if (obj.restingOn) {
        const dx = obj.x - obj.restingOn.x;
        const dy = obj.y - obj.restingOn.y;
        const dist = Math.hypot(dx, dy);
        const combinedRadius = (obj.radius ?? obj.h / 2) + (obj.restingOn.radius ?? obj.restingOn.h / 2);

        if (dist > combinedRadius + 1) {
            obj.restingOn = null;
        }
    }
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
        obj.restingOn = other;
        return true;
    }

    obj.vy = -v2 * bounce;
    other.vy = -v1 * bounce;
    return true;

}


