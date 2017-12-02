const socket = io.connect('http://localhost:8080');

var keyWidth = 50, keyHeight = 70, keySpace = 15;
var keyRows = 10, keyCols = 2;
var s = 52;
var chord = '';

var gStenophoneNumberBar = [], gKeyIsHeld = [], gKeyPressThresholds = [];
var gStenophoneKeys = [
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s),new Array (s),new Array (s),
  new Array (s),new Array (s)
];

const gStenotypeQWERTYKeys = ['Q','W','S','E','D','R','F','C','V','T','N','M','U','J','I','K','O','L','P',';','[','"'];
const gStenotypeKeys = {
  topRow:    ['S','T','P','H','*','F','P','L','T','D'],
  bottomRow: ['S','K','W','R','*','R','B','G','S','Z'],
  vowelRow:            ['A','O','E','U']
}
const gStenotypeKeysArr = ['S','T','K','P','W','H','R','A','O','*','E','U','F','R','P','B','L','G','T','S','D','Z',];

const gStenotypeSensors = {
  topRow:    [0, 1, 3, 5, 9, 12, 14, 16, 18, 20],
  bottomRow: [0, 2, 4, 6, 9, 13, 15, 17, 19, 21],
  vowelRow:            [7, 8, 10, 11]
}

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
  socket.on('stenophoneKeyPresses', function(data) {gKeyIsHeld           = data;});
  socket.on('keyPressThresholds',   function(data) {gKeyPressThresholds  = data;});
}

var offsetX = 30, offsetY = 100;

function draw() {
  background(250);
  translate(offsetX, offsetY);
  drawStenoChord();
  drawStenoKeys();
}

function drawStenoChord() {
  noStroke();
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  keysHeld = '';
  for (var i = 0; i < gKeyIsHeld.length; i++)
    if (gKeyIsHeld[i]) keysHeld += gStenotypeKeysArr[i];
  if (chord.length < keysHeld.length) chord = keysHeld;
  if (keysHeld.length === 0) chord = '';
  text(chord, 300, -50);
}

function drawStenoKeys()
{
  // Top two rows
  strokeWeight(1);
  for (var i = 0; i < keyRows; i++) {
    for (var j = 0; j < keyCols; j++) {
      let x1 = i * keyWidth + i * keySpace;
      let y1 = (j + 1) * keyHeight + j * keySpace;
      let sensorI = 0, stenotypeI;
      if (j == 0) {
        sensorI = gStenotypeSensors.topRow[i];    // 0 1 3 5
        stenotypeI = gStenotypeKeys.topRow[i];    // S T P H
      }
      if (j == 1) {
        sensorI = gStenotypeSensors.bottomRow[i]; // 0 2 4 6
        stenotypeI = gStenotypeKeys.bottomRow[i]; // S K W R
      }
      if (i == 4) x1 += 10;
      if (i >= 5) x1 += 20;
      drawRectAndKeyPress(x1, y1, sensorI);
      drawThresholdLines(x1, y1, i, j, gKeyPressThresholds.min, gKeyPressThresholds.max, sensorI);
      drawSparkline(x1, y1, sensorI, i, j);
      drawStenotypeKey(x1, y1, sensorI, stenotypeI);
    }
  }
  // Vowel row
  for (var i = 0; i < 4; i++) {
    let x1 = i * keyWidth + i * keySpace + keyWidth * 3.5 + keySpace/2;
    let y1 = keyHeight * 3 + keySpace * 2;
    let sensorI = 0, stenotypeI;
    sensorI = gStenotypeSensors.vowelRow[i]; // 7 8 10 11
    stenotypeI = gStenotypeKeys.vowelRow[i]; // A O E  U
    if (i >= 2) x1 = i * keyWidth + i * keySpace + keyWidth * 3.5 + keySpace * 1.5;
    drawRectAndKeyPress(x1,y1, sensorI);
    drawThresholdLines(x1, y1, i, 3, gKeyPressThresholds.min, gKeyPressThresholds.max, sensorI);
    drawSparkline(x1, y1, sensorI, i, j);
    drawStenotypeKey(x1, y1, sensorI, stenotypeI);
  }
}

function drawRectAndKeyPress(x , y, sI) {
  noStroke();
  let outer = 220;
  let inner = outer - 30;
  fill(outer,outer,outer);
  rect(x, y, keyWidth, -keyHeight);
  if (gKeyIsHeld[sI] === true) {
    fill(inner,inner,inner);
    rect(x, y - (gKeyPressThresholds.min * keyHeight),
         keyWidth, - (gKeyPressThresholds.min * keyHeight * 2));
  }
}

function drawThresholdLines(x, y, row, col, min, max, sI) {
  noStroke();
  fill(map(gStenophoneKeys[sI][s-1],0,1,230,180));
  let sensorY = -gStenophoneKeys[sI][s-1]*keyHeight;
  rect(x, y, keyWidth, sensorY);
  if (gStenophoneKeys[sI][s-1]>max) {
    noStroke();
    fill(160);
    // rect(x, y - (min*keyHeight), keyWidth, -((1-max) * keyHeight));
  }
  if (gStenophoneKeys[sI][s-1]>min) {
    fill(160);
    rect(x, y, keyWidth, -(min * keyHeight));
    noFill();
    stroke(120);
    line(x,          y - (min * keyHeight),
    x + keyWidth -1, y - (min * keyHeight));
    line(x,          y - (max * keyHeight),
    x + keyWidth -1, y - (max * keyHeight));
  }
}

function drawSparkline(x, y, sI, row, col) {
  noFill();
  beginShape();
  for (var k = 0; k < s; k++) {
    stroke(0,0,255,map(gStenophoneKeys[sI][k],0,1,0,150));
    let sensorY = keyHeight - gStenophoneKeys[sI][k] * keyHeight + (col * keyHeight) + (col * keySpace);
    curveVertex(x + k, sensorY);
  }
  endShape();
  // Sparkline point
  let sensorY = keyHeight - gStenophoneKeys[sI][s-1] * keyHeight + (col * keyHeight) + (col * keySpace);
  stroke(255,0,0,map(gStenophoneKeys[sI][s-1],0,1,0,150));
  fill(255,0,0,map(gStenophoneKeys[sI][s-1],0,1,0,150));
  ellipse(x+keyWidth, sensorY, 2, 2);
}

function drawStenotypeKey(x, y, sensorI, stenoI) {
  noStroke();
  let stenotypeSize = map(gStenophoneKeys[sensorI][s-1],0,1,18,26);
  let stenotypeFill = map(gStenophoneKeys[sensorI][s-1],0,1,180,0);
  fill(stenotypeFill);
  textSize(stenotypeSize);
  textAlign(CENTER,CENTER);
  text(stenoI, x+ (keyWidth/2), y - (keyHeight/2.5) + 2);
}