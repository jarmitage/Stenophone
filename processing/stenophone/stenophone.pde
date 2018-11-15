/*

 Stenophone Processing sketch:
 - Receives sensor data from Teensy
 - Converts to QWERTY keystrokes
 - Draws a Stenotype GUI w/ sensors underlaid

 Stenophone
 Jack Armitage, 2015

 */

import netP5.*;
import oscP5.*;
import processing.serial.*;
import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.util.Map;

int TOTAL_SENSORS = 22;

int[] lookup = {4, 7, 3, 6, 2, 5, 18, 9, 17, 8, 16, 10, 19, 11, 21, 12, 23, 13, 20, 14, 22, 15};
int[] min_old = {699, 852, 850, 763, 754, 828, 797, 725, 680, 712, 880, 809, 726, 892, 858, 808, 838, 819, 860, 821, 754, 924};
int[] max_old = {880, 940, 935, 911, 900, 930, 932, 930, 898, 888, 946, 934, 994, 945, 937, 918, 923, 907, 947, 934, 918, 949};

// 2017-11-21
int[] min = {824, 880, 890, 885, 829, 914, 889, 837, 818, 820, 890, 870, 806, 916, 873, 886, 857, 872, 904, 871, 841, 921};
int[] max = {925, 939, 953, 954, 935, 957, 966, 952, 937, 913, 963, 958, 993, 959, 961, 957, 944, 936, 968, 962, 943, 961};

// Serial communication
int baud = 9600;
Serial teensy;
char endChar = '\n';
String[] teensyRead = new String[TOTAL_SENSORS + 1]; // 22 sensors + 1 switch
boolean teensyConnected = false;

// Sensors and states
int[] sensorsTmp = new int[TOTAL_SENSORS];
int[] sensors = new int[TOTAL_SENSORS];
int[] prevSensors = new int[TOTAL_SENSORS];
int[] sensorMasks = new int[TOTAL_SENSORS];
int maskThreshold = 50;
int maxThreshold = 1000;
boolean sensorMaskCalculated = false;
boolean[] isKeyBeingHeld = new boolean[TOTAL_SENSORS];
float sensorMax = 600, sensorMin = 200; // !
int switchState = 0;

// Keyboard simulation
Robot keyboard;
HashMap<Integer, Integer> keyMap = new HashMap<Integer, Integer>();
String[] keys = {"d", "s", "q", "r", "e", "w", "t", "c", "m", "j", "k", "l", "semicolon", "quote", "n", "v", "f", "u", "p", "i", "openbracket", "o"};

// OSC
OscP5 oscP5;
NetAddress address;

// GUI
PImage stenoImg;
float keyWidth = 29, keyHeight = 57, keySpace = 13.5;
float keyRows = 10, keyCols = 2;

void setup()
{
  size(460, 240);
  connectToTeensy();
  oscP5 = new OscP5(this,9000);
  address = new NetAddress("127.0.0.1", 12000);
  setupKeyboard();
  //stenoImg = loadImage("steno.png");
}

void draw()
{
  background(255);
  if (teensyConnected) {
    arrayCopy(sensorsTmp, sensors);
    if (!sensorMaskCalculated) {
      calculateSensorMasks();
      sensorMaskCalculated = true;
    } else {
      maskSensors();
      createKeyEvents();
      sendKeyPositions();
      drawShiftBar();
      translate(10, 30);
      drawBarGraph();
    }
  }
  drawTeensyStatus();
  // printArray(sensors);
}

void calculateSensorMasks()
{
  for (int i = 0; i < TOTAL_SENSORS; i++) {
    sensorMasks[i] = sensors[i] + maskThreshold;
  }
}

void maskSensors()
{
  for (int i = 0; i < TOTAL_SENSORS; i++) {
    if (sensors[i] <= min[i]) {
      sensors[i] = 0;
    } else {
      sensors[i] = (int)map(constrain(sensors[i], 0, max[i]), min[i], max[i], 0, 1024);
    }
  }
}

void sendKeyPositions()
{
  for (int i = 0; i < TOTAL_SENSORS; i++) {
    if (prevSensors[i] > 0) {
      OscMessage msg = new OscMessage("/" + keys[i] + "/");
      msg.add(sensors[i]);
      oscP5.send(msg, address);
    }
  }
}

void createKeyEvents()
{
  // Press keys that have just entered the min/max region
  // and release those that have just left
  for (int i = 0; i < TOTAL_SENSORS; i++) {
    if (sensorMax < sensors[i] && sensors[i] > prevSensors[i])
    {
      if (isKeyBeingHeld[i] == false)
      {
        pressKey(i);
        isKeyBeingHeld[i] = true;
      }
    } else if (sensorMin > sensors[i] && sensors[i] < prevSensors[i])
      if (isKeyBeingHeld[i] == true)
      {
        releaseKey(i);
        isKeyBeingHeld[i] = false;
      }
  }
}

void pressKey(int key)
{
  keyboard.keyPress(keyMap.get(key));
  println(key);
}

void releaseKey(int key)
{
  keyboard.keyRelease(keyMap.get(key));
}

void drawShiftBar()
{
  // Black/white bar across top of GUI showing
  // microswitch/shift state
  stroke(0);
  if (switchState == 1)
    fill(0);
  else
    fill(255);
  rect(10, 5, width - 20, 15);
}

void drawStenoKeys()
{
  // Draw bar graphs underneath the Steno image
  // showing the current reading for each key
  noStroke();
  // Top two rows
  for (int i = 0; i < keyRows; i++) {
    for (int j = 0; j < keyCols; j++) {
      fill(sensors[i] >> 2, 255 - (sensors[i] >> 2), 0);
      float current = sensors[j * (int)keyRows + i];

      if (i < 4)
      {
        rect(i * keyWidth + i * keySpace,
          (j + 1) * keyHeight + j * keySpace,
          keyWidth,
          map(current, sensorMin, sensorMax, 0, -keyHeight));
      } else if (i == 4)
      {
        rect(i * keyWidth + i * keySpace + keySpace + 1,
          (j + 1) * keyHeight + j * keySpace,
          keyWidth,
          map(current, sensorMin, sensorMax, 0, -keyHeight));
      } else if (i > 4)
      {
        rect(i * keyWidth + i * keySpace + keySpace * 2 + 1,
          (j + 1) * keyHeight + j * keySpace,
          keyWidth,
          map(current, sensorMin, sensorMax, 0, -keyHeight));
      }
    }
  }
  // Vowel row
  for (int i = 0; i < 4; i++) {
    fill(sensors[i + 17] >> 2, 255 - (sensors[i + 17] >> 2), 0);
    float current = sensors[i + 17];
    if (i < 2)
    {
      rect(i * keyWidth + i * keySpace + keyWidth * 4 + keySpace/2,
        keyHeight * 3 + keySpace * 2,
        keyWidth,
        map(current, sensorMin, sensorMax, 0, -keyHeight));
    } else {
      rect(i * keyWidth + i * keySpace + keyWidth * 4 + keySpace * 1.5,
        keyHeight * 3 + keySpace * 2,
        keyWidth,
        map(current, sensorMin, sensorMax, 0, -keyHeight));
    }
  }
  image(stenoImg, 0, 0);
}

void drawBarGraph()
{
  // Draw a simple bar graph of sensor output
  for (int i = 0; i < TOTAL_SENSORS; i++) {
    fill(sensors[i] >> 2, 255 - (sensors[i] >> 2), 0);
    rect(i * 18, height, keyWidth/2, map(sensors[i], 0, 1024, 0, -height));
  }
}

void drawTeensyStatus()
{
  // Display whether Teensy is connected
  textSize(10);
  String teensyState = "";
  if (teensyConnected)
  {
    teensyState = "Connected";
    fill(0, 255, 0);
  } else {
    teensyState = "Not connected";
    fill(255, 0, 0);
  }
  text(teensyState, width - 90, height - 40);
}

void printArray(int[] array)
{
  // Print sensors array, for debugging purposes
  for (int i = 0; i < array.length; i++)
    print(array[i]+ " ");
  println();
}

void serialEvent(Serial teensy)
{
  arrayCopy(sensors, prevSensors); // Copy sensors array to prevSensors array
  teensyRead = teensy.readString().split(" "); // Split serial values into array by " " char
  if (teensyRead.length == 24)
  {
    for (int i = 0; i < TOTAL_SENSORS; i++)
    {
      sensorsTmp[i] = constrain(Integer.parseInt(teensyRead[lookup[i] - 2]), 0, 1024);
    }
    switchState = Integer.parseInt(teensyRead[22]);
  }
}

void connectToTeensy()
{
  // Find usb serial device and try to connect
  for (int i = 0; i < Serial.list().length; i++)
  {
    String name = Serial.list()[i];
    if (name.startsWith("/dev/tty.usb"))
    {
      try {
        teensy = new Serial(this, Serial.list()[i], baud);
        teensy.bufferUntil(endChar);
        teensyConnected = true;
        println("Connected to Teensy @ " + name);
        break;
      }
      catch (RuntimeException e) {
        e.printStackTrace();
        teensyConnected = false;
      }
    }
  }
  delay(50);  // Stability delay
}

void setupKeyboard()
{
  // Initialise arrays to prevent weirdness
  for (int i = 0; i < TOTAL_SENSORS; ++i) {
    sensors[i] = 0;
    prevSensors[i] = 0;
  }

  // Create a robot or die
  try {
    keyboard = new Robot();
  }
  catch (AWTException e) {
    e.printStackTrace();
    exit();
  }

  // Mapping Sensors -> QWERTY
  keyMap.put(0,  KeyEvent.VK_Q);
  keyMap.put(1,  KeyEvent.VK_W);
  keyMap.put(2,  KeyEvent.VK_S);
  keyMap.put(3,  KeyEvent.VK_E);
  keyMap.put(4,  KeyEvent.VK_D);
  keyMap.put(5,  KeyEvent.VK_R);
  keyMap.put(6,  KeyEvent.VK_F);
  keyMap.put(7,  KeyEvent.VK_C);
  keyMap.put(8,  KeyEvent.VK_V);
  keyMap.put(9,  KeyEvent.VK_T);
  keyMap.put(10, KeyEvent.VK_N);
  keyMap.put(11, KeyEvent.VK_M);
  keyMap.put(12, KeyEvent.VK_U);
  keyMap.put(13, KeyEvent.VK_J);
  keyMap.put(14, KeyEvent.VK_I);
  keyMap.put(15, KeyEvent.VK_K);
  keyMap.put(16, KeyEvent.VK_O);
  keyMap.put(17, KeyEvent.VK_L);
  keyMap.put(18, KeyEvent.VK_P);
  keyMap.put(19, KeyEvent.VK_SEMICOLON);
  keyMap.put(20, KeyEvent.VK_OPEN_BRACKET);
  keyMap.put(21, KeyEvent.VK_QUOTE);
}