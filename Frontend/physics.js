export function applyPhysics(obj, options = {}, allObjects = []) {

    const {
        gravity = 9.8,
        restitution = 0.8,
        canvasHeight = 600,
        deltaTime = 1 / 60,
        currentLesson = null,
        friction = 0
    } = options;

    if (currentLesson !== "kinematics") {
        obj.vy += gravity * deltaTime; // Apply gravity
    }

    if (currentLesson === "friction") {
        obj.vx *= 1 - friction * deltaTime;
        obj.vy *= 1 - friction * deltaTime;
    }

    obj.x += obj.vx * deltaTime; // Update position based on velocity
    obj.y += obj.vy * deltaTime; // Update position based on velocity

    const bottom = obj.y + (obj.radius || obj.h / 2);
    if (bottom > canvasHeight) {
        obj.y = canvasHeight - (obj.radius || obj.h / 2); // Prevent going below the canvas
        obj.vy *= -restitution; // Reverse velocity with restitution
    }

    if (obj.radius) {
        for (let other of allObjects) {
            if (other === obj || !other.radius) continue; // Skip self and non-circles

            const dx = other.x - obj.x;
            const dy = other.y - obj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = obj.radius + other.radius;

            if (dist < minDist) {
                // Simple overlap resolution
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                obj.x -= nx * overlap / 2;
                obj.y -= ny * overlap / 2;
                other.x += nx * overlap / 2;
                other.y += ny * overlap / 2;
            }
        }
    }
}
