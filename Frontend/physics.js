export function applyPhysics(objects, canvas, currentLesson){
    let gravity = parseFloat(document.getElementById("gravity")?.value) || 9.8;
    let restitution = parseFloat(document.getElementById("restitution")?.value) || 0.8;
    let frictionCoefficient = parseFloat(document.getElementById("friction")?.value) || 0.0;

    for(let o of objects){
        //Default
        let mass = parseFloat(document.getElementById("mass")?.value) || 1.0;
    }
}