const fs   = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const osc = require('osc');
const SerialPort = require('serialport');

const TOTAL_SENSORS         = 22;
const gUpdateRate           = 50; // ms
const gSendOSC              = false;
const gSendKeyPresses       = true;
const gUpdateClient         = true;
const gLogStenophoneKeys    = false;
const gSampleNewCalibration = false;

/* Setup Stenophone */
var gStenophoneKeys = [], gStenophoneNumberBar = 0, gSerialIsConnected = false;
const gSensorLookup = [4, 7, 3, 6, 2, 5, 18, 9, 17, 8, 16, 10, 19, 11, 21, 12, 23, 13, 20, 14, 22, 15]; // hardware sensor mapping
var gStenophoneKeysPrev1 = [], gStenophoneNumberBarPrev = 0;
var gStenophoneKeysPrev2 = [];
var gStenophoneKeysPrev3 = [];
const gStenophoneKeyMins = [0.8032121212121262, 0.8645200391006904, 0.8680332355816279, 0.888420332355808, 0.800600195503428, 0.901057673509278, 0.8703890518084099, 0.8292746823069383, 0.7966314760508315, 0.8104535679374405, 0.8712922776148609, 0.8631847507331447, 0.7928660801564061, 0.8991417399804423, 0.8559002932551361, 0.8715288367546459, 0.8348895405669536, 0.8605826001955124, 0.883464320625606, 0.862690127077231, 0.8189345063538565, 0.9144926686217077];
const gStenophoneKeyMaxs = [0.8994936461387991, 0.9204301075268851, 0.9331808406647147, 0.9365239491691112, 0.9110107526881802, 0.9353880742913014, 0.943217986314756, 0.931841642228743, 0.9181583577712658, 0.8897849462365517, 0.9376422287390026, 0.9308914956011767, 0.9669853372433971, 0.9358533724340189, 0.9375444770283479, 0.9337927663734141, 0.9176578690127132, 0.9105063538612014, 0.9443968719452541, 0.9387741935483859, 0.9287038123167206, 0.9473431085043929];
/* Stenophone sensor calibration */
var gCalibrateSampleCount = 0, gCalibrateSamples = 500;
var gCalibrateArray = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]], gCalibrateAverage = [];

/* Setup SerialPort and SerialParser */
const Readline = SerialPort.parsers.Readline;
var serialPort = new SerialPort('/dev/tty.usbmodem1225391', {baudRate: 9600});
const serialParser = serialPort.pipe(new Readline({delimiter: `\r\n`}));
serialParser.on('data', function (data) {
  // Update previous values
  gStenophoneKeysPrev3  = gStenophoneKeysPrev2;
  gStenophoneKeysPrev2  = gStenophoneKeysPrev1;
  gStenophoneKeysPrev1  = gStenophoneKeys;
  gStenophoneNumberBarPrev = gStenophoneNumberBar;
  // Read new values and reorder array
  let tmp = [];
  let tmp2 = data.split(" ").slice(0, 22).map(x => x/1023);
  for (var i = 0; i < tmp2.length; i++) tmp[i] = tmp2[gSensorLookup[i] - 2];
  // Apply existing calibration or create a new one
  if (gSampleNewCalibration === false) {
    gStenophoneKeys = tmp.map(function applyCurrentCalibration(value, index) {
      let oldMin = gStenophoneKeyMins[index], oldMax = gStenophoneKeyMaxs[index];
      let newValue = (value - oldMin) / (oldMax - oldMin);
      let prev1 = gStenophoneKeysPrev1[index];
      let prev2 = gStenophoneKeysPrev2[index];
      let prev3 = gStenophoneKeysPrev3[index];
      if (prev1 * prev2 * prev3 > 0)
        newValue = (newValue + prev1 + prev2 + prev3) / 4;
      return Math.min(Math.max(newValue, 0.0), 1.0);
    });
    gStenophoneNumberBar = data.split(" ").slice(22,23).map(Number);
  } else if (gSampleNewCalibration === true) {
    // Print an average of 500 samples for each sensor to the console and exit
    if (gCalibrateSampleCount++ <= gCalibrateSamples) {
      for (var i = 0; i < tmp.length; i++) gCalibrateArray[i].push(tmp[i]);
    } else {
      for (var i = 0; i < tmp.length; i++) {
        let sum = 0;
        for (var j = 0; j < gCalibrateSamples; j++) sum += gCalibrateArray[i][j];
        gCalibrateAverage[i] = sum / gCalibrateSamples;
      }
      console.log(gCalibrateAverage);
      process.exit();
    }
  }
  // Sensor logging to file
  if (gLogStenophoneKeys) {
    gStenophoneKeys = data.split(" ").slice(0, 22).map(Number).map(x => x/1023);
    fs.appendFile('gStenophoneKeys.csv', gStenophoneKeys + '\n', function(err) {if(err) throw err;});
  }
  gSerialIsConnected = true;
});
serialParser.on("error", function (error) {
  console.log("Error: ", error.message);
});

/* Setup OSC to keyEventHandler */
const gStenotypeKeys = ['q','w','s','e','d','r','f','c','v','t','n','m','u','j','i','k','o','l','p','semicolon','openbracket','quote'];
var keyEventHandler = new osc.UDPPort({
    localAddress:  "127.0.0.1", localPort:  57131,
    remoteAddress: "127.0.0.1", remotePort: 57130,
    metadata: true
});
keyEventHandler.open();
keyEventHandler.on("ready", function () {console.log("KeyEventHandler UDP port is ready");});
keyEventHandler.on("error", function (error) {console.log("Error: ", error.message);});
const gKeyPressMin = 0.2, gKeyPressMax = 0.6;
var gKeyIsHeld = new Array (TOTAL_SENSORS);
gKeyIsHeld.fill(false);

/* Setup OSC to SuperCollider */
var superCollider = new osc.UDPPort({
    localAddress:  "127.0.0.1", localPort:  57121,
    remoteAddress: "127.0.0.1", remotePort: 57120,
    metadata: true
});
superCollider.open();
superCollider.on("ready", function () {console.log("SuperCollider UDP port is ready");});
superCollider.on("error", function (error) {console.log("Error: ", error.message);});

function pressKey (key) {
  keyEventHandler.send({address: '/press_key', args: [{type:'s', value: key}]});
}
function releaseKey (key) {
  keyEventHandler.send({address: '/release_key', args: [{type:'s', value: key}]});
}

/* Client side */
var server = http.createServer(handleRequest);
server.listen(8080);

function handleRequest(req, res) {
  var pathname = req.url;
  if (pathname == '/') {
    pathname = '/src/index.html';
  }
  var ext = path.extname(pathname);
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };
  var contentType = typeExt[ext] || 'text/plain';
  fs.readFile(__dirname + pathname,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
    console.log("Client connected:", socket.id);
    socket.emit('keyPressThresholds', {min:gKeyPressMin, max:gKeyPressMax});
    socket.on('disconnect', function() {
      console.log("Client disconnected:", socket.id);
    });
  }
);

/* Global event loop */
var update = setInterval(function() {
    if (gSerialIsConnected) {
      for (var i = 0; i < gStenotypeKeys.length; i++) {
        /* Send Key events to KeyEventHandler */
        if (gSendKeyPresses) {
          if (gKeyPressMax < gStenophoneKeys[i] &&
              gStenophoneKeys[i] > gStenophoneKeysPrev1[i] &&
              gKeyIsHeld[i] === false) {
                console.log("Key pressed: ", gStenotypeKeys[i]);
                pressKey(gStenotypeKeys[i]);
                gKeyIsHeld[i] = true;
          } else if (gKeyPressMin > gStenophoneKeys[i] &&
                    gStenophoneKeys[i] < gStenophoneKeysPrev1[i] &&
                    gKeyIsHeld[i] === true) {
                console.log("Key released: ", gStenotypeKeys[i]);
                releaseKey(gStenotypeKeys[i]);
                gKeyIsHeld[i] = false;
          }
        }
        /* Forward Stenophone data over OSC to SuperCollider */
        // github.com/colinbdclark/osc.js/issues/102
        if (gSendOSC) {
          superCollider.send(
            {
              address: '/stenophone/key/' + gStenotypeKeys[i],
              args: [{type:'f', value: gStenophoneKeys[i]}]
            }
          );
          superCollider.send(
            {
              address: '/stenophone/numberbar/',
              args: [{type: 'i', value: gStenophoneNumberBar}]
            }
          );
        }
        /* Send data to client */
        if (gUpdateClient) {
          io.emit("stenophoneKeys",       gStenophoneKeys);
          io.emit("stenophoneNumberBar",  gStenophoneNumberBar);
          io.emit('stenophoneKeyPresses', gKeyIsHeld);
        }
      }
    }
}, gUpdateRate);