export function applyPhysics(obj, options = {}, allObjects = []) {
    const {
        gravity = 9.8,
        restitution = 0.8,
        canvasHeight = 600,
        deltaTime = 1 / 60,
        currentLesson = null,
        friction = 0
    } = options;

    // Gravity (not for kinematics)
    if (currentLesson !== "kinematics") {
        obj.vy += gravity * deltaTime;
    }

    // Freefall logic
    if (currentLesson === "freefall") {
        obj.vx = 0; // No horizontal movement
    }

    // Friction logic
    if (currentLesson === "friction") {
        obj.vx *= 1 - friction * deltaTime;
        obj.vy *= 1 - friction * deltaTime;
    }

    // Position update
    obj.x += obj.vx * deltaTime;
    obj.y += obj.vy * deltaTime;

    // Floor collision (canvas bottom)
    const bottom = obj.y + (obj.radius || obj.h / 2);
    if (bottom > canvasHeight) {
        obj.y = canvasHeight - (obj.radius || obj.h / 2);
        obj.vy *= -restitution;
    }

    // Handle circle-to-circle collisions
    if (obj.radius) {
        for (let other of allObjects) {
            if (other === obj || !other.radius) continue;

            const dx = other.x - obj.x;
            const dy = other.y - obj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = obj.radius + other.radius;

            if (dist < minDist) {
                // Resolve overlap
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                obj.x -= nx * overlap / 2;
                obj.y -= ny * overlap / 2;
                other.x += nx * overlap / 2;
                other.y += ny * overlap / 2;

                // Elastic velocity exchange (equal mass)
                const vxRel = obj.vx - other.vx;
                const vyRel = obj.vy - other.vy;
                const relVelAlongNormal = vxRel * nx + vyRel * ny;

                if (relVelAlongNormal > 0) continue;

                const bounce = Math.min(obj.restitution ?? 0.8, other.restitution ?? 0.8);
                const impulse = -(1 + bounce) * relVelAlongNormal / 2;

                obj.vx += impulse * nx;
                obj.vy += impulse * ny;
                other.vx -= impulse * nx;
                other.vy -= impulse * ny;
            }
        }
    }
}
