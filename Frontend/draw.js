import { getAccelerationFromForce } from "./physics.js";

export function drawObject(ctx, obj, PixelPerMeter, canvas) {
  ctx.beginPath();
  if (obj.radius) {
    ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  } else {
    ctx.rect(obj.x, obj.y, obj.w, obj.h);
  }

  ctx.fillStyle = "#0077cc";
  ctx.fill();

  const heightMeters = (((canvas.height - obj.y) / PixelPerMeter) - 1).toFixed(2);
  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${heightMeters}m`, obj.x, obj.y - (obj.radius || obj.h / 2) - 5);

  const vy = (obj.vy ?? 0).toFixed(2);
  ctx.fillText(`v: ${-vy} m/s`, obj.x, obj.y + (obj.radius || obj.h / 2) + 15);
}

export function drawKinematicsObject(ctx, obj, PixelPerMeter) {
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

  let height = (canvas.height - obj.y - (obj.radius || obj.h / 2)) / PixelPerMeter;
  if (height < 0.05) height = 0;


  const velocity = Math.hypot(obj.vx ?? 0, obj.vy ?? 0) / PixelPerMeter;

  const pe = (mass * gravityVal * height).toFixed(2);
  const ke = (0.5 * mass * velocity ** 2).toFixed(2);
  const totalE = (parseFloat(pe) + parseFloat(ke)).toFixed(2);

  ctx.fillText(`PE: ${pe} J`, obj.x, obj.y - obj.radius - 15);
  ctx.fillText(`KE: ${ke} J`, obj.x, obj.y - obj.radius);
  ctx.fillText(`E: ${totalE} J`, obj.x, obj.y + obj.radius + 15);
}

export function drawRuler(ctx, canvas, PixelPerMeter, RulerStartX) {
  const rulerX = RulerStartX;
  const rulerY = canvas.height - 30;
  const interval = PixelPerMeter; // 1 meter per tick (e.g. 50px)

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";

  // === Vertical Ruler ===
  ctx.beginPath();
  ctx.moveTo(rulerX, 0);
  ctx.lineTo(rulerX, canvas.height);
  ctx.stroke();

  ctx.textAlign = "right";

  for (let y = 0; y <= canvas.height; y += interval) {
    const heightMeters = ((canvas.height - y) / PixelPerMeter);

    ctx.beginPath();
    ctx.moveTo(rulerX - 5, y);
    ctx.lineTo(rulerX + 5, y);
    ctx.stroke();

    // Label only at multiples of 5 meters
    if (heightMeters % 5 === 0) {
      ctx.fillText(`${heightMeters}m`, rulerX - 10, y + 4);
    }
  }

  // === Horizontal Ruler ===
  ctx.beginPath();
  ctx.moveTo(0, rulerY);
  ctx.lineTo(canvas.width, rulerY);
  ctx.stroke();

  ctx.textAlign = "center";

  for (let x = rulerX; x <= canvas.width; x += interval) {
    const widthMeters = ((x - rulerX) / PixelPerMeter);

    ctx.beginPath();
    ctx.moveTo(x, rulerY - 5);
    ctx.lineTo(x, rulerY + 5);
    ctx.stroke();

    // Label only at multiples of 5 meters
    if (widthMeters % 5 === 0) {
      ctx.fillText(`${widthMeters}m`, x, rulerY + 20);
    }
  }
}


export function drawVelocityArrow(ctx, obj, PixelPerMeter, scale = 1) {
  const vx = obj.vx ?? 0;
  const vy = obj.vy ?? 0;
  const speed = Math.hypot(vx, vy);
  if (speed < 0.01) return;

  const startX = obj.x;
  const startY = obj.y;
  const endX = startX + vx * PixelPerMeter * scale;
  const endY = startY + vy * PixelPerMeter * scale;

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
