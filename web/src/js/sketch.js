var socket;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  socket = io.connect('http://localhost:8080');
  socket.on('mouse',
    function(data) {
      console.log("Got: " + data.x + " " + data.y);
      fill(0,0,255);
      noStroke();
      ellipse(data.x,data.y,80,80);
    }
  );
  socket.on('stenophoneKeys'), function(data) {
    console.log('stenophoneKeys:', data);
  };
}

function draw() {}

function mouseDragged() {
  fill(255);
  noStroke();
  ellipse(mouseX,mouseY,80,80);
  sendmouse(mouseX,mouseY);
}

function sendmouse(xpos, ypos) {
  console.log("sendmouse: " + xpos + " " + ypos);
  var data = {
    x: xpos,
    y: ypos
  };
  socket.emit('mouse',data);
}