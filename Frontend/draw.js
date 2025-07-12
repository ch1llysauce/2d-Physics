import { getAccelerationFromForce } from "./physics.js";

export function drawObject(ctx, obj, PixelPerMeter, canvas) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#0077cc";
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    const effectivePPM = PixelPerMeter * (obj.zoomLevel ?? 1);
    const heightMeters = ((canvas.height - obj.y - obj.radius) / effectivePPM).toFixed(2);

    ctx.fillText(`${heightMeters}m`, obj.x, obj.y - obj.radius - 5);
    const vy = ((obj.vy ?? 0) / effectivePPM).toFixed(2);
    ctx.fillText(`v: ${-vy} m/s`, obj.x, obj.y + obj.radius + 15);
}

export function drawKinematicsObject(ctx, obj, PixelPerMeter, canvas) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#0077cc";
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

 
  const vx = ((obj.vx ?? 0) / PixelPerMeter).toFixed(2);
  const vy = ((-obj.vy ?? 0) / PixelPerMeter).toFixed(2);
  const speed = Math.hypot(obj.vx ?? 0, obj.vy ?? 0) / PixelPerMeter;

  ctx.fillText(`vx: ${vx} m/s`, obj.x, obj.y - obj.radius - 10);
  ctx.fillText(`vy: ${vy} m/s`, obj.x, obj.y - obj.radius + 5);
  ctx.fillText(`|v|: ${speed.toFixed(2)} m/s`, obj.x, obj.y + obj.radius + 15);
}

export function drawForcesObject(ctx, obj, PixelPerMeter) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#cc3300";
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const vx = ((obj.vx ?? 0) / PixelPerMeter).toFixed(2);
  const vy = ((-obj.vy ?? 0) / PixelPerMeter).toFixed(2);
  const speed = Math.hypot(obj.vx ?? 0, obj.vy ?? 0) / PixelPerMeter;

  ctx.fillText(`vx: ${vx} m/s`, obj.x, obj.y - obj.radius - 10);
  ctx.fillText(`vy: ${vy} m/s`, obj.x, obj.y - obj.radius + 5);
  ctx.fillText(`|v|: ${speed.toFixed(2)} m/s`, obj.x, obj.y + obj.radius + 15);

  const { ax, ay } = getAccelerationFromForce(obj);
  if (Number.isFinite(ax) && Number.isFinite(ay)) {
    const aMagnitude = Math.hypot(ax, ay).toFixed(2);
    ctx.fillText(`a: ${aMagnitude} m/s²`, obj.x, obj.y + obj.radius + 30);
  }
}

export function drawFrictionObject(ctx, obj, PixelPerMeter) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#000000";
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const effectivePPM = PixelPerMeter / (obj.zoomLevel ?? 1);
  const vx = ((obj.vx ?? 0) / PixelPerMeter).toFixed(2);
  const vy = ((-obj.vy ?? 0) / PixelPerMeter).toFixed(2);
  const speed = Math.hypot(obj.vx ?? 0, obj.vy ?? 0) / PixelPerMeter;

  ctx.fillText(`vx: ${vx} m/s`, obj.x, obj.y - obj.radius - 10);
  ctx.fillText(`vy: ${vy} m/s`, obj.x, obj.y - obj.radius + 5);
  ctx.fillText(`|v|: ${speed.toFixed(2)} m/s`, obj.x, obj.y + obj.radius + 15);

  const { ax, ay } = getAccelerationFromForce(obj);
  if (Number.isFinite(ax) && Number.isFinite(ay)) {
    const aMagnitude = Math.hypot(ax, ay).toFixed(2);
    ctx.fillText(`a: ${aMagnitude} m/s²`, obj.x, obj.y + obj.radius + 30);
  }
}


export function drawWorkEnergyObject(ctx, obj, PixelPerMeter, canvas) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#828934";
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const mass = obj.mass ?? 1;
  const gravityVal = obj.gravity ?? 9.8;
  
  // Consistent calculation with other modules (multiply instead of divide)
  const effectivePPM = PixelPerMeter * (obj.zoomLevel ?? 1);
  
  // Height calculation (same as free fall)
  let height = (canvas.height - obj.y - obj.radius) / effectivePPM;
  if (height < 0.05) height = 0;

  // Velocity components (consistent with kinematics)
  const vx = (obj.vx ?? 0) / effectivePPM;
  const vy = (obj.vy ?? 0) / effectivePPM;
  const velocity = Math.hypot(vx, vy);

  // Energy calculations
  const pe = (mass * gravityVal * height).toFixed(2);
  const ke = (0.5 * mass * velocity ** 2).toFixed(2);
  const totalE = (parseFloat(pe) + parseFloat(ke)).toFixed(2);

  // Display layout similar to other modules
  ctx.fillText(`h: ${height.toFixed(2)}m`, obj.x, obj.y - obj.radius - 20);  // Height at top
  ctx.fillText(`PE: ${pe} J`, obj.x, obj.y - obj.radius - 5);               // PE next
  ctx.fillText(`KE: ${ke} J`, obj.x, obj.y - obj.radius + 10);             // KE below
  ctx.fillText(`E: ${totalE} J`, obj.x, obj.y + obj.radius + 15);          // Total energy at bottom
  ctx.fillText(`v: ${velocity.toFixed(2)} m/s`, obj.x, obj.y + obj.radius + 30); // Speed at very bottom
}

export function drawRuler(ctx, canvas, PixelPerMeter, RulerStartX, zoomLevel = 1) {
  const rulerX = RulerStartX;
  const rulerY = canvas.height - 30;
  const interval = 50;

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";

  const effectivePPM = PixelPerMeter * zoomLevel;

  // === Vertical Ruler (Y-axis, positive meters only) ===
  ctx.beginPath();
  ctx.moveTo(rulerX, 0);
  ctx.lineTo(rulerX, canvas.height);
  ctx.stroke();

  ctx.textAlign = "left";
  for (let i = 0; i <= canvas.height; i += interval) {
    const y = canvas.height - i;
    const meterValue = i / effectivePPM;

    if (meterValue < 0 || y < 15 || y > canvas.height - 10) continue;

    ctx.beginPath();
    ctx.moveTo(rulerX - 5, y);
    ctx.lineTo(rulerX + 5, y);
    ctx.stroke();

    ctx.fillText(`${meterValue.toFixed(2)}m`, rulerX - 20, y + 4);
  }

  // === Horizontal Ruler (X-axis, positive meters only) ===
  ctx.beginPath();
  ctx.moveTo(0, rulerY);
  ctx.lineTo(canvas.width, rulerY);
  ctx.stroke();

  ctx.textAlign = "center";
  for (let x = rulerX; x < canvas.width; x += interval) {
    const meterValue = (x - rulerX) / effectivePPM;

    if (meterValue < 0 || x < 40 || x > canvas.width - 20) continue;

    ctx.beginPath();
    ctx.moveTo(x, rulerY - 5);
    ctx.lineTo(x, rulerY + 5);
    ctx.stroke();

    ctx.fillText(`${meterValue.toFixed(2)}m`, x, rulerY + 20);
  }
}



export function drawVelocityArrow(ctx, obj, scale = 10) {
  const vx = obj.vx ?? 0;
  const vy = obj.vy ?? 0;
  const speed = Math.hypot(vx, vy);

  if (speed < 0.1) return;

  const startX = obj.x;
  const startY = obj.y;
  const endX = startX + vx * scale;
  const endY = startY + vy * scale;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.stroke();

  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 8;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(endX, endY);
  ctx.fillStyle = "#ff0000";
  ctx.fill();
}

export function formatVelocity(obj, PixelPerMeter) {
  const vy = obj.vy ?? 0;
  const vx = obj.vx ?? 0;
  const speed = Math.hypot(vx, vy) / PixelPerMeter;
  return (vy > 0 ? -speed : speed).toFixed(2);
}
