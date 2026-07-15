# Stenophone Buffer Circuit Notes

## Problem

The Stenophone PCB experiences noisy/false sensor signals, likely worsened after physical transport to a conference. Two contributing factors:

1. **Stray capacitance on multiplexed ADC lines** — Each sensor has ~10KΩ source impedance through a voltage divider. When the mux (74HC4067) switches channels, the Teensy's ADC sample-and-hold capacitor plus stray trace/connector capacitance must charge through that resistance. With an RC time constant of ~300ns and needing 7-10 time constants to settle to 10-bit accuracy, readings are taken before the voltage has settled. This causes crosstalk between adjacent channels.

2. **Mechanical damage from travel** — The FPC ribbon cable connector (Molex 52207-1685) and breadboard jumper wires are susceptible to loosening from vibration, which increases contact resistance and worsens the settling time problem.

## Solution: Op-Amp Buffer

Place a unity-gain voltage follower (op-amp with output tied to inverting input) between each mux COM output and the Teensy ADC input pin. This isolates the high-impedance sensor network from the ADC's low-impedance charging requirement.

```
Mux COM ──→ Op-Amp (+) input
             Op-Amp (-) ←── Op-Amp output ──→ Teensy ADC pin
```

Two buffers needed: one for the 16-channel mux COM, one for the 8-channel mux COM. Wired on the breadboard between the ribbon cable and the Teensy.

## Op-Amp Selection

The sensors read at 0.80–0.95× VCC (see calibration values in `web/index.js`), so the op-amp output must swing close to VCC. This rules out bipolar-output op-amps (TL072, LM358, CA3140, CA3240) which clip ~1.5V below VCC.

### Recommended: CA 3130E (×2)

- MOSFET input (1.5TΩ impedance) + CMOS output (rail-to-rail, within 10mV of rails)
- 15MHz bandwidth, 30V/µs slew rate
- Runs on 5V single supply
- DIP-8 package, breadboard-friendly
- Available at Ihlutir for 530 ISK each (1,060 ISK total) — stock check pending

### Alternative: CA 3130T (×2)

Same chip in TO-5 metal can package at 150 ISK each. Not directly breadboard-compatible but can be adapted with soldered leads.

### Why not other parts in stock at Ihlutir

| Part | Issue |
|------|-------|
| CA 3240E | MOSFET input but **bipolar output** — not rail-to-rail despite similar part number |
| TLC 272 | Output maxes at VDD − 1.2V |
| TL 072 | Output clips ~1.5V below VCC |
| LM 358 / LM 324 | Bipolar output, same rail problem |
| ICL 7641 | Would work (CMOS rail-to-rail) but quad package, slower, 1,327 ISK |

## Software Mitigations (Already Partially In Place)

- 4-sample moving average in `web/index.js` (lines 50-51) smooths noise but adds latency
- A dummy `analogRead()` before the real read in `stenophone.ino:anMuxRead()` would help settling time even without the buffer

## Mechanical Checks

Before adding the buffer, verify:
1. Reseat the FPC ribbon cable in the Molex 52207-1685 connector
2. Reseat all breadboard jumper wires, especially mux COM and ADC lines
3. Run calibration (`gSampleNewCalibration = true` in `web/index.js`) and compare against hardcoded min/max values to identify bad channels
