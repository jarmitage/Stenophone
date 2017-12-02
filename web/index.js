const fs   = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const osc = require('osc');
const SerialPort = require('serialport');

const TOTAL_SENSORS         = 22;
const gUpdateRate           = 10; // ms
const gSendOSC              = false;
const gSendKeyPresses       = true;
const gUpdateClient         = true;
const gLogStenophoneKeys    = false;
const gSampleNewCalibration = false;

/* Setup Stenophone */
var gStenophoneKeys = [], gStenophoneNumberBar = 0, gSerialIsConnected = false;
const gSensorLookup = [4, 7, 3, 6, 2, 5, 18, 9, 17, 8, 16, 10, 19, 11, 21, 12, 23, 13, 20, 14, 22, 15]; // hardware sensor mapping
var gStenophoneKeysPrev = [], gStenophoneNumberBarPrev = 0;
const gStenophoneKeyMins = [0.8028758553274735, 0.8599765395894489, 0.8679608993157429, 0.8873646138807354, 0.8011143695014726, 0.900633431085036, 0.8695855327468268, 0.830414467253174, 0.7922619745845593, 0.8076285434995149, 0.8685532746823116, 0.8643851417399868, 0.7907174975562122, 0.8969188660801497, 0.8523988269794782, 0.8711573802541572, 0.8323831867057631, 0.857481915933532, 0.8816050830889488, 0.8605689149560202, 0.8198142717497504, 0.9141446725317762];
const gStenophoneKeyMaxs = [0.9232121212121269, 0.9199120234604143, 0.9405141739980425, 0.9341837732160339, 0.9543636363636311, 0.9322385141740019, 0.9475053763440799, 0.9257438905180911, 0.9680801564027377, 0.8874447702834721, 0.9394271749755604, 0.9304105571847551, 0.9699530791788953, 0.9392903225806436, 0.9323773216031318, 0.9299315738025463, 0.9547605083088909, 0.9068484848484857, 0.9491476050830818, 0.9359120234604117, 0.9689130009775232, 0.9433939393939349];
/* Stenophone sensor calibration */
var gCalibrateSampleCount = 0, gCalibrateSamples = 500;
var gCalibrateArray = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]], gCalibrateAverage = [];

/* Setup SerialPort and SerialParser */
const Readline = SerialPort.parsers.Readline;
var serialPort = new SerialPort('/dev/tty.usbmodem1225391', {baudRate: 9600});
const serialParser = serialPort.pipe(new Readline({delimiter: `\r\n`}));
serialParser.on('data', function (data) {
  // Update previous values
  gStenophoneKeysPrev      = gStenophoneKeys;
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
              gStenophoneKeys[i] > gStenophoneKeysPrev[i] &&
              gKeyIsHeld[i] === false) {
                console.log("Key pressed: ", gStenotypeKeys[i]);
                pressKey(gStenotypeKeys[i]);
                gKeyIsHeld[i] = true;
          } else if (gKeyPressMin > gStenophoneKeys[i] &&
                    gStenophoneKeys[i] < gStenophoneKeysPrev[i] &&
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
        if (gUpdateClient) {
          io.emit("stenophoneKeys",       gStenophoneKeys);
          io.emit("stenophoneNumberBar",  gStenophoneNumberBar);
          io.emit('stenophoneKeyPresses', gKeyIsHeld);
        }
      }
    }
}, gUpdateRate);