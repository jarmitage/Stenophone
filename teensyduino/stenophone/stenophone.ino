/*

  Stenophone Teensyduino sketch:
  - Reads sensor data from analogue multiplexers
  - Sends as serial data
  - Simulates sensors for debugging

  Stenophone
  Jack Armitage, 2015
  http://www.jarm.is/mat/idmt/cruftfest/stenophone.html

 */

#include "stenophone.h"

int baud = 115200;
int printDelay = 10; // Stability delay inside loop()
int sensorValues[TOTAL_CHANNELS]; // Set to USED_CHANNELS if not debugging 16ch 0-1
int ledState = LOW;
int switchState = LOW;

// Sensor simulator
boolean sensorIsRising[USED_CHANNELS];
int sensorSimMax = 900;
int sensorSimMin = 700;

void setup() {
  Serial.begin(baud);
  pinSetup();
  anMuxSetup();
}

void loop() {
  readSensors(2, 24); // 16ch 0-1 not connected
  printSensors(2, 24);
  readAndPrintSwitch();
  Serial.println(); // 'Master' carriage return
  delay(printDelay);
  blinkLed();
}

void readSensors(int first, int last)
{
  for (int i = first; i < last; i++) {
    sensorValues[i] = anMuxRead(i);
//    Serial.println(sensorValues[i]);
  }
}

void printSensors(int first, int last)
{
  for (int i = first; i < last; i++) {
    Serial.print(sensorValues[i]);
    Serial.print(" ");
  }
}

void readAndPrintSwitch()
{
  switchState = digitalRead(shiftKey);
  Serial.print(switchState);
  Serial.print(" ");
}

int anMuxRead(int channel)
{
  setAnMuxChannel(channel);
  if (channel < 16)
    return analogRead(com16); // sample 16ch mux
  else
    return analogRead(com8); // sample 8ch mux

  return 0;
}

void setAnMuxChannel(int channel)
{
  // Write channel value to correct AnMux IC
  // as binary data
  if (channel < 16) { // set 16ch mux
    digitalWrite(s160, (channel & 0x01));
    digitalWrite(s161, ((channel >> 1) & 0x01));
    digitalWrite(s162, ((channel >> 2) & 0x01));
    digitalWrite(s163, ((channel >> 3) & 0x01));
  } else { // set 8ch mux
    channel -= 16;  // 0 index channel no.
    digitalWrite(s80, (channel & 0x01));
    digitalWrite(s81, ((channel >> 1) & 0x01));
    digitalWrite(s82, ((channel >> 2) & 0x01));
  }
}

void pinSetup() {
  pinMode(en16, OUTPUT);  // 16ch mux enable
  pinMode(s160, OUTPUT);  // 16ch mux S0-3
  pinMode(s161, OUTPUT);
  pinMode(s162, OUTPUT);
  pinMode(s163, OUTPUT);
  pinMode(en8, OUTPUT);   // 8ch mux enable
  pinMode(s80, OUTPUT);   // 8ch mux S0-2
  pinMode(s81, OUTPUT);
  pinMode(s82, OUTPUT);
  pinMode(led, OUTPUT);
  pinMode(shiftKey, INPUT);
}

void anMuxSetup()
{
  digitalWrite(en16, LOW); // set EN -> GND
  digitalWrite(en8, LOW);  // set EN -> GND
}

void initSensorSim()
{
  // Set initial values to halfway between min & max
  for (int i = 0; i < USED_CHANNELS; i++) {
    sensorValues[i] = (sensorSimMax + sensorSimMin) / 2;
  } 
}

void sensorSim()
{
  // To simulate the hardware, make sensorsValues[]
  // rise and fall between a max and min
  for (int i = 0; i < USED_CHANNELS; i++) {
    if (sensorIsRising[i])
      sensorValues[i] += random(20);
    else
      sensorValues[i] -= random(20);

    if (sensorValues[i] >= sensorSimMax)
    {
      sensorValues[i] = sensorSimMax - random(20);
      sensorIsRising[i] = !sensorIsRising[i];
    } else if (sensorValues[i] <= sensorSimMin)
    {
      sensorValues[i] = sensorSimMin + random(20);
      sensorIsRising[i] = !sensorIsRising[i];
    }
  }  
}

void togglePin(int pin)
{
  digitalWrite(pin, LOW);
  delay(100);
  digitalWrite(pin, HIGH);
  delay(100);
}

void blinkLed()
{
  digitalWrite(led, ledState);
  if (ledState == LOW)
    ledState = HIGH;
  else
    ledState = LOW;
}
