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
        if (currentLesson !== "kinematics") {
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
                // 1. Calculate normal
                let nx, ny;
                if (dist === 0) {
                    const angle = Math.random() * 2 * Math.PI;
                    nx = Math.cos(angle);
                    ny = Math.sin(angle);
                } else {
                    nx = dx / dist;
                    ny = dy / dist;
                }

                // 2. Resolve overlap
                const overlap = minDist - dist;
                obj.x -= nx * overlap / 2;
                obj.y -= ny * overlap / 2;
                other.x += nx * overlap / 2;
                other.y += ny * overlap / 2;

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
}