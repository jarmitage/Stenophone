import time
import sys
import json
from pythonosc import dispatcher
from pythonosc import osc_server

import pykeyboard
k = pykeyboard.PyKeyboard()

# from pynput.keyboard import Key, Controller
# keyboard = Controller()

def press_key (unused_addr, key):
    k.press_key(key)
    # keyboard.press(key)
    print ("Key pressed: {}".format(key))

def release_key (unused_addr, key):
    k.release_key(key)
    # keyboard.release(key)
    print ("Key released: {}".format(key))

if __name__ == "__main__":
    dispatcher = dispatcher.Dispatcher()
    dispatcher.map("/press_key", press_key)
    dispatcher.map("/release_key", release_key)

    server = osc_server.ThreadingOSCUDPServer(("127.0.0.1", 57130), dispatcher)
    print("Serving on {}".format(server.server_address))
    server.serve_forever()

