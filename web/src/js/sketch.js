const socket = io.connect('http://localhost:8080');

var gStenophoneKeys = [], gStenophoneNumberBar = [], gKeyIsHeld = [], gKeyPressThresholds = [];
const gStenotypeKeys = ['q','w','s','e','d','r','f','c','v','t','n','m','u','j','i','k','o','l','p','semicolon','openbracket','quote'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  socket.on('connect',function(){socket.emit('connected', 'Hello server');});
  socket.on('stenophoneKeys',       function(data) {gStenophoneKeys      = data;});
  socket.on('stenophoneNumberBar',  function(data) {gStenophoneNumberBar = data;});
  socket.on('stenophoneKeyPresses', function(data) {gKeyIsHeld           = data;});
  socket.on('keyPressThresholds',   function(data) {gKeyPressThresholds  = data;});
}

function draw() {
  var c = color(255, 204, 0);  // Define color 'c'
  fill(c);  // Use color variable 'c' as fill color
  noStroke();  // Don't draw a stroke around shapes
  rect(30, 20, 55, 55);  // Draw rectangle
}
