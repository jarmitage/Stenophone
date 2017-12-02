import netP5.*;
import oscP5.*;
import processing.serial.*;
import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.util.Map;

Robot keyboard;
HashMap<String, Integer> keyMap = new HashMap<String, Integer>();
OscP5 oscP5;
NetAddress address;
OscMessage keyCommand;
boolean newOSCMessageReceived = false;

void setup() {
  oscP5   = new OscP5(this,57130);
  address = new NetAddress("127.0.0.1", 57131);
  setupKeyboard();
  noLoop();
}
void oscEvent(OscMessage msg) {
  println(msg.get(0));
  String path = msg.addrPattern();
  String k    = msg.get(0).stringValue();
  if (path.equals("/press_key"))   pressKey   (k);
  if (path.equals("/release_key")) releaseKey (k);
}
void pressKey   (String key) {keyboard.keyPress   (keyMap.get(key));}
void releaseKey (String key) {keyboard.keyRelease (keyMap.get(key));}
void setupKeyboard() {
  try {
    keyboard = new Robot();
  }
  catch (AWTException e) {
    e.printStackTrace();
    exit();
  }
  keyMap.put("q", KeyEvent.VK_Q);
  keyMap.put("w", KeyEvent.VK_W);
  keyMap.put("s", KeyEvent.VK_S);
  keyMap.put("e", KeyEvent.VK_E);
  keyMap.put("d", KeyEvent.VK_D);
  keyMap.put("r", KeyEvent.VK_R);
  keyMap.put("f", KeyEvent.VK_F);
  keyMap.put("c", KeyEvent.VK_C);
  keyMap.put("v", KeyEvent.VK_V);
  keyMap.put("t", KeyEvent.VK_T);
  keyMap.put("n", KeyEvent.VK_N);
  keyMap.put("m", KeyEvent.VK_M);
  keyMap.put("u", KeyEvent.VK_U);
  keyMap.put("j", KeyEvent.VK_J);
  keyMap.put("i", KeyEvent.VK_I);
  keyMap.put("k", KeyEvent.VK_K);
  keyMap.put("o", KeyEvent.VK_O);
  keyMap.put("l", KeyEvent.VK_L);
  keyMap.put("p", KeyEvent.VK_P);
  keyMap.put("semicolon",   KeyEvent.VK_SEMICOLON);
  keyMap.put("openbracket", KeyEvent.VK_OPEN_BRACKET);
  keyMap.put("quote",       KeyEvent.VK_QUOTE);
}