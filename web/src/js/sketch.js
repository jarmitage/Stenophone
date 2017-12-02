const socket = io.connect('http://localhost:8080');

// var gStenophoneKeys = []
var gStenophoneNumberBar = [], gKeyIsHeld = [], gKeyPressThresholds = [];

var s = 30;
var gStenophoneKeys = [
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s)
];

const gStenotypeKeys = ['q','w','s','e','d','r','f','c','v','t','n','m','u','j','i','k','o','l','p','semicolon','openbracket','quote'];

const socketPollInterval = 25;
var socketPollCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  socket.on('connect',function() {socket.emit('connected', 'Hello server');});
  socket.on('stenophoneKeys', function(data) {
    if (socketPollCounter++ >= socketPollInterval) {
      for (var i = 0; i < data.length; i++) {
        gStenophoneKeys[i].push(data[i]);
        gStenophoneKeys[i].shift();
      }
      socketPollCounter = 0;
    }
  });
  // socket.on('stenophoneNumberBar',  function(data) {gStenophoneNumberBar = data;});
  // socket.on('stenophoneKeyPresses', function(data) {gKeyIsHeld           = data;});
  socket.on('keyPressThresholds',   function(data) {gKeyPressThresholds  = data;});
}

var offsetX = 30, offsetY = 30;

function draw() {
  background(255);
  translate(offsetX, offsetY);
  drawStenoKeys();
}

var keyWidth = 29, keyHeight = 57, keySpace = 13.5;
var keyRows = 10, keyCols = 2;

function drawStenoKeys()
{
  // Top two rows
  for (var i = 0; i < keyRows; i++) {
    for (var j = 0; j < keyCols; j++) {
      noFill();
      stroke(0.0,0.0,0.0);
      strokeWeight(1);
      if (i < 4) {
        var x1 = i * keyWidth + i * keySpace;
        var y1 = (j + 1) * keyHeight + j * keySpace;
        rect(x1, y1, keyWidth, -keyHeight);
        line(x1,            y1 - (gKeyPressThresholds.min * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.min * keyHeight));
        line(x1,            y1 - (gKeyPressThresholds.max * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.max * keyHeight));
        beginShape();
        for (var k = 0; k < s; k++) {curveVertex(x1 + k, keyHeight - gStenophoneKeys[i][k] * keyHeight)}
        endShape();
      } else if (i == 4) {
        var x1 = i * keyWidth + i * keySpace + 1;
        var y1 = (j + 1) * keyHeight + j * keySpace;
        rect(x1, y1, keyWidth, -keyHeight);
        line(x1,            y1 - (gKeyPressThresholds.min * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.min * keyHeight));
        line(x1,            y1 - (gKeyPressThresholds.max * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.max * keyHeight));
        beginShape();
        for (var k = 0; k < s; k++) {curveVertex(x1 + k, keyHeight - gStenophoneKeys[i][k] * keyHeight)}
        endShape();
      } else if (i > 4) {
        var x1 = i * keyWidth + i * keySpace + keySpace * 2 + 1;
        var y1 = (j + 1) * keyHeight + j * keySpace;
        rect(x1, y1, keyWidth, -keyHeight);
        line(x1,            y1 - (gKeyPressThresholds.min * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.min * keyHeight));
        line(x1,            y1 - (gKeyPressThresholds.max * keyHeight),
             x1 + keyWidth, y1 - (gKeyPressThresholds.max * keyHeight));
        beginShape();
        for (var k = 0; k < s; k++) {curveVertex(x1 + k, keyHeight - gStenophoneKeys[i][k] * keyHeight)}
        endShape();
      }
    }
  }
  // Vowel row
  // for (var i = 0; i < 4; i++) {
  //   fill(gStenophoneKeys[i + 17] >> 2, 255 - (gStenophoneKeys[i + 17] >> 2), 0);
  //   var current = gStenophoneKeys[i + 17];
  //   if (i < 2)
  //   {
  //     rect(i * keyWidth + i * keySpace + keyWidth * 4 + keySpace/2,
  //       keyHeight * 3 + keySpace * 2,
  //       keyWidth,
  //       map(current, 0.0, 1.0, 0, -keyHeight));
  //   } else {
  //     rect(i * keyWidth + i * keySpace + keyWidth * 4 + keySpace * 1.5,
  //       keyHeight * 3 + keySpace * 2,
  //       keyWidth,
  //       map(current, 0.0, 1.0, 0, -keyHeight));
  //   }
  // }
  // image(stenoImg, 0, 0);
}
