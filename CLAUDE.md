# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Stenophone is a musical instrument combining live coding and stenotype (chorded keyboard). It uses continuous gestural control of keys to manipulate algorithms and their parameters simultaneously. Developed by Jack Armitage in the Augmented Instruments Laboratory.

## Architecture

The system is a hardware-to-software pipeline with multiple integration layers:

1. **Teensy firmware** (`teensyduino/`) — Arduino/Teensyduino sketch reads 22 analog sensors (via 16-channel and 8-channel multiplexers) and a shift microswitch over serial at 115200 baud. Sensor-to-channel mapping is defined in `stenophone.h`.

2. **Node.js server** (`web/index.js`) — Central hub that:
   - Reads serial data from Teensy, reorders sensor values using `gSensorLookup` hardware mapping
   - Applies calibration (min/max normalization + 4-sample moving average smoothing)
   - Converts continuous sensor values to discrete key press/release events using threshold hysteresis (`gKeyPressMin`/`gKeyPressMax`)
   - Forwards key events via OSC (UDP) to a key event handler on port 57130
   - Forwards continuous sensor data via OSC to SuperCollider on port 57120
   - Serves a p5.js web visualization via HTTP on port 8080, streaming data over Socket.IO

3. **Key event handler** — Receives OSC key events and simulates keyboard input for Plover (stenotype software). Two implementations exist: Processing (`processing/keyEventHandler/`) and Python (`python/keyEventHandler.py`, noted as not fully working).

4. **Plover integration** (`plover/tidal.json`) — Stenotype dictionary mapping chords to TidalCycles live coding commands.

5. **SuperCollider** (`supercollider/stenophone.scd`) — OSC listener for continuous sensor data, enabling direct sound control.

6. **Max/MSP** (`max/stenophone.maxpat`) — Alternative audio routing.

7. **Hardware design** — PCB schematics in Eagle (`eagle/`) and KiCad (`kicad/`).

## Build & Run Commands

### Web server (Node.js)
```bash
cd web
yarn install
node index.js
```
The serial port path in `index.js` (currently `/dev/tty.usbmodem1225391`) must match the connected Teensy device.

### Teensy firmware
Upload `teensyduino/stenophone/stenophone.ino` via Arduino IDE or Teensyduino with Teensy board selected.

## Key Configuration

In `web/index.js`:
- `gSendOSC` — enable/disable OSC to SuperCollider
- `gSendKeyPresses` — enable/disable key event forwarding
- `gUpdateClient` — enable/disable web visualization updates
- `gSampleNewCalibration` — set `true` to sample 500 readings and output new calibration values
- `gUpdateRate` — main loop interval in ms (default 50)

## Communication Ports

| Service | Protocol | Port |
|---------|----------|------|
| Web visualization | HTTP | 8080 |
| Key event handler (send) | OSC/UDP | 57130 |
| Key event handler (receive) | OSC/UDP | 57131 |
| SuperCollider (send) | OSC/UDP | 57120 |
| SuperCollider (receive) | OSC/UDP | 57121 |
