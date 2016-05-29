var points = [];
var velocities = [];
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var springiness = 0.015;
var damping = 0.98;
var spreading = 0.015;
var lastX = 0;
var thisX = 0;
var movement = 0;
var fps = 0;
var date = new Date();
var time = date.getTime();
var counter = 0;
var displayedFPS = 0;
var rippleSize = -10;

for (i=0; i < canvas.width/2; i++){            //create an array for the Y values of each point
  points.push(0);
}

for (i=0; i < points.length; i++){             //create an array for the Y velocities of each point
  velocities.push(0);
}

function drawFrame() {                  //draws the line
  context.beginPath();
  var x = 0
  context.moveTo(x, (canvas.height/2) + points[0]);
  
  for (i = 1; i < points.length; i++) {
    context.lineTo(i*(canvas.width/(points.length-1)), 150 + points[i]);
  }
  
  context.lineWidth = 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#0000ff';
  context.stroke();
}

function updateFrame() {                      //updates the positions of the points of the line
  spread(); 
  for (i=0; i < points.length; i++){
    velocities[i] += points[i] * springiness; //acceleration
    velocities[i] *= damping; //damping
    points[i] -= velocities[i]; //position changing
  }
}

function spread(){                         //spreads the waves
  for (j=1; j<10; j++){
  var lastVelocities = velocities;
  var lastPoints = points;
  for (i=1; i < points.length-1 ; i++){
    points[i] = ((3*points[i])+lastPoints[i-1]+lastPoints[i+1])/5;
    velocities[i] = ((3*velocities[i])+lastVelocities[i-1]+lastVelocities[i+1])/5;
  }
  }
}

window.requestAnimFrame = (function(callback) {  // i'm not entirely sure what this does, but it works...
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

function animate() {                                    // main loop 
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  
  // update
  updateFrame();
  // clear
  context.clearRect(0, 0, canvas.width, canvas.height);

  // draw stuff
  drawFrame();
  var date = new Date();
  fps = Math.round(1000/(date.getTime() - time));   // really bad way of calculating fps
  time = date.getTime();
  counter++;
  if (counter>=30) {
    displayedFPS = fps
    counter = 0;
  }
  context.fillText(displayedFPS + "fps",10,30);
  // request new frame
  requestAnimFrame(function() {
    animate();
  });
}

animate();
context.font="20px Arial";

function startListen(event) {           //start drawing ripples
  canvas.addEventListener('mousemove', splash, false);
  lastX = Math.round(event.pageX/2);
  movement = event.pageX;
} 

function stopListen(event) {              //stop drawing ripples
  canvas.removeEventListener('mousemove', splash, false);
  lastX = null;
  if (movement === event.pageX) {
    click(Math.round(event.pageX/2));
  }
}

function splash(event){
  thisX = Math.round(event.pageX/2);
  if (thisX != lastX){   
    makeRipple(thisX, rippleSize);
  }
  if (thisX+1>lastX){
    for(n=lastX+1;n<thisX;n++){
      makeRipple(n, rippleSize);
    }
  }
  else if (thisX-1<lastX) {
    for(n=lastX-1;n>thisX;n--){
      makeRipple(n, rippleSize);
    }
  }
  lastX = thisX;
}
  
function click(x) {
  makeRipple(x, -300);
}
    
function makeRipple(x, height) {
  if (0<x && x<(canvas.width/2)-1) {
    velocities[x] += height;
  }
}

document.getElementById('myCanvas').addEventListener('mousedown', startListen);  // mouse event listeners
document.getElementById('myCanvas').addEventListener('mouseup', stopListen); 
