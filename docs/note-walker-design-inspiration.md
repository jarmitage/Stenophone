# Note Walker as Design Inspiration for the Stenophone

> A design study, not a product integration. The goal is to mine the *ideas*
> behind Ben Osterhouse's **Note Walker** MIDI plug-in and ask what they become
> when forced through the Stenophone's specific physical constraints.
>
> Source video: ["Note Walker || Introduction"](https://www.youtube.com/watch?v=W9VDDlbccCM)
> (Ben Osterhouse, 2026-06-04).

## Contents

1. [What Note Walker is](#what-note-walker-is)
2. [Note Walker stripped to its essence](#note-walker-stripped-to-its-essence)
3. [The Stenophone keyboard mapping](#the-stenophone-keyboard-mapping)
4. [The Stenophone's constraints that actually matter](#the-stenophones-constraints-that-actually-matter)
5. [The core resonance](#the-core-resonance)
6. [Concrete native mechanics](#concrete-native-mechanics)
7. [Honest frictions](#honest-frictions)
8. [The payoff](#the-payoff)

---

## What Note Walker is

Note Walker is a MIDI effect (it makes no sound itself, only triggers other
instruments) built around a single mechanic:

- The **first key held becomes an anchor**.
- Every **additional key moves a scale-snapped "pitch cursor"** by its interval
  distance from the anchor — not by its literal pitch.
- So **two fingers can walk scales and arpeggios** across the whole keyboard.
- If you **release the anchor while still holding other keys, the anchor jumps**
  to the most recently played key, letting you reverse direction mid-run.
- All movement is **snapped to a scale/triad**, set by a separate row of keys.

It exposes three controls, deliberately pruned from many during development:

- **Synth Mode** — holds the output note until the anchor releases, guaranteeing
  unbroken legato (ideal for mono synths with glide/portamento).
- **Auto Walk** — held intervals step rhythmically, turning it into an
  arpeggiator; arpeggiated notes respond to velocity (and an optional
  mod-wheel→velocity mapping).
- **Transpose** — because it is fundamentally one-note-at-a-time and cannot play
  chords, you run multiple instances transposed differently to walk parallel
  intervals / voice-led chords.

## Note Walker stripped to its essence

Forget MIDI, scales, and pianos. Five transferable ideas remain — **none of them
about pitch**:

1. **Input is relative, not absolute.** You never name a destination; you name a
   *move from where you are*. The anchor is a reference frame; everything else is
   a delta.
2. **Key identity is repurposed as relationship.** A key means "+3 from anchor,"
   not "E4." Physical position encodes interval, not value.
3. **A constraint set turns crude input into good output.** Scale-snapping means
   a sloppy gesture still lands on something musical. The *constraint* does the
   skilled work, freeing the performer to be expressive rather than accurate.
4. **State is path-dependent.** Anchor-jumps-to-most-recent means the current
   frame depends on the *history* of what was held, not just what is down now.
   You can reverse, pivot, drift.
5. **Radical economy.** Two fingers reach everything; one hand carries the line
   so the other is freed to change context.

These describe a *way of mapping a sparse, discrete surface onto a large
continuous space*. That is the part worth stealing.

## The Stenophone keyboard mapping

Each of the 22 sensors carries one identity through three representations,
reconstructed from `web/index.js` (`gStenotypeKeys`), `web/src/js/sketch.js`
(`gStenotypeKeysArr`), and `docs/stenotype_qwerty.png`:

| Sensor idx | QWERTY key | Steno letter | Bank / role     |
|-----------:|:----------:|:------------:|:----------------|
| 0          | Q          | **S-**       | Left, top       |
| 1          | W          | **T-**       | Left, top       |
| 2          | S          | **K-**       | Left, bottom    |
| 3          | E          | **P-**       | Left, top       |
| 4          | D          | **W-**       | Left, bottom    |
| 5          | R          | **H-**       | Left, top       |
| 6          | F          | **R-**       | Left, bottom    |
| 7          | C          | **A**        | Vowel (thumb)   |
| 8          | V          | **O**        | Vowel (thumb)   |
| 9          | T          | **\***       | Center (asterisk) |
| 10         | N          | **E**        | Vowel (thumb)   |
| 11         | M          | **U**        | Vowel (thumb)   |
| 12         | U          | **-F**       | Right, top      |
| 13         | J          | **-R**       | Right, bottom   |
| 14         | I          | **-P**       | Right, top      |
| 15         | K          | **-B**       | Right, bottom   |
| 16         | O          | **-L**       | Right, top      |
| 17         | L          | **-G**       | Right, bottom   |
| 18         | P          | **-T**       | Right, top      |
| 19         | ;          | **-S**       | Right, bottom   |
| 20         | [          | **-D**       | Right, top      |
| 21         | '          | **-Z**       | Right, bottom   |

Plus a 23rd input: the **shift microswitch** (`shiftKey`, pin 5 in
`teensyduino/stenophone/stenophone.h`), read as the "number bar" and handled
separately from the analog sensors.

This is the **standard Ward Stone Ireland steno layout** (the same one Plover
uses). The geometry matters: the **left hand plays initial consonants, the right
hand plays finals, the thumbs play vowels, and `*` sits dead-center** as a
modifier. A "chord" is any simultaneous combination, read left-to-right as a
syllable; Plover then maps the whole chord through `plover/tidal.json` to a
live-coding command (currently a single stub, `S*D → d1`).

### The three-layer signal path

There is a deeper structural fact, visible in `web/index.js`, that makes the
Stenophone unusual: **every key is analog (0–1), and the system forks each value
two ways.**

- A **discrete path** — threshold hysteresis (`gKeyPressMin=0.2`,
  `gKeyPressMax=0.6`) plus a "still-rising / still-falling" check and a per-key
  `gKeyIsHeld` latch — produces clean chord events for Plover.
- A **continuous path** — the raw float — is streamed over OSC to SuperCollider.

One gesture, two simultaneous meanings. Crucially, anything *below* the press
threshold is invisible to Plover but fully alive as continuous data: **there is a
hidden analog band beneath every digital chord.**

## The Stenophone's constraints that actually matter

- **Chording is the native verb.** It is *bad* at note-by-note sequences (that is
  what QWERTY is for) and *good* at simultaneous shapes. A "stroke" is a
  committed shape that resolves to meaning.
- **Every key is a continuous 0–1 sensor.** A chord is not a binary set — it is a
  **22-dimensional pressure vector** that morphs continuously while held. There is
  an expressive surface *inside* a single held chord.
- **A hidden analog band sits beneath every chord.** Everything under the
  `0.2/0.6` hysteresis is ignored by Plover but available to sound.
- **Steno has anatomy.** Left = onsets, right = codas, thumbs = vowels, asterisk
  = center. The surface is **bilaterally symmetric with a pivot** — a piano
  keyboard is not.
- **Two pipes that never touch.** The discrete path types commands into
  Plover/Tidal; the continuous path streams pressure to SuperCollider. Today they
  run in parallel and never interact — even though the 2017 thesis was explicitly
  about manipulating *algorithms and their parameterisation simultaneously*.

## The core resonance

Note Walker's deepest move is **dissolving the line between *selecting* a note
and *modulating* a note** — both become "distance from anchor." The Stenophone's
deepest unsolved tension is the line between ***typing a command*** (discrete)
and ***modulating sound*** (continuous) — the two pipes.

So the inspired mapping is **not** "add pitch-walking." It is:

> **The committed chord is the anchor. Continuous pressure *deviation* from that
> held chord is the cursor. The anchor is the code; the walk is the performance
> of the code.**

You do not type a command and *then* separately twiddle parameters. You drop an
anchor in command-space by committing a chord, and then every continuous thing
your fingers do *while that chord is held* is a relative walk — through a
parameter, a pattern, a pitch set — snapped to whatever constraint is active.
This is the bridge between the two pipes, and Note Walker is the blueprint.

It reframes the whole instrument as **continuous live coding**: trajectories
*through* code-space rather than discrete jumps between chords.

## Concrete native mechanics

Each mechanic is tied to a specific Stenophone affordance, not ported
wholesale from a piano.

### 1. Bilateral lean as the cursor

*(uses the steno left/right anatomy + center pivot)*

Note Walker's "distance up/down from anchor" maps onto the Stenophone's
left/right symmetry directly. With a chord held, the *balance* of pressure —
leaning into the left bank vs. the right bank — walks a parameter down vs. up.
The asterisk (sensor 9, literally in the middle) is the natural zero/pivot. A
piano cannot do this; the mirror geometry makes "direction" a physical,
two-handed quantity.

### 2. Walking in the sub-threshold band

*(uses the hidden analog layer beneath every chord)*

The expressive cursor needs no new sensors — it lives *below* the press
threshold. Commit a chord (cross `0.6`), then the partial-pressure wiggle under
each held key (the `0.2–0.6` zone Plover ignores) becomes the walk. The discrete
chord and the continuous walk are the *same fingers at two pressure depths* — the
dual-path fusion made physical.

### 3. Anchor-jump → re-chording *without release*

*(solves chorded live coding's discrete-jump problem)*

The most valuable transfer. Chorded live coding's worst limitation is that
commands are *discrete jumps*: to get from algorithm A to B you release and
re-chord — no in-between, no morph. Note Walker's anchor-jump-on-partial-release
is precisely a mechanism for *continuous trajectories from discrete keys*.
Applied here: lift some fingers and the *remaining* held shape becomes the new
anchor, so you can crawl from one command to a neighbouring one — interpolating
their parameters along the way — without ever fully letting go. Code becomes
something you **steer through**, not retype.

### 4. Scale-snapping → grammar-snapping

*(uses the Plover dictionary as the constraint set)*

Note Walker's scale is the Stenophone's **Plover dictionary**. Snapping a
continuously-morphing chord-vector to the *nearest valid command* is the exact
analogue of quantizing a cursor to scale degrees — and the *distance* to that
command (how cleanly you are hitting it) is free expressive data: an
"uncertainty" or "blend" signal you can route to sound. The constraint set
(legal syntax) does the skilled work, just as the scale does in Note Walker.

### 5. Auto Walk → drawing patterns against the Tidal cycle clock

*(uses the adjacent pattern engine)*

Note Walker's Auto Walk turns a held interval into rhythm. The Stenophone lives
next to a pattern clock (TidalCycles), so a held chord sampled on the cycle
becomes a step sequence, and the *pressure trajectory traced while holding* is
the pattern being drawn. Gesture and algorithm, sampled together — verbatim the
instrument's founding thesis.

### 6. Shift switch as sustain → recovering the "free hand"

*(uses the existing latch outside the 22 analog keys)*

Note Walker frees the left hand because the right alone covers the melody. The
Stenophone cannot do that natively — chords often commit *both* hands. But the
shift microswitch (already a separate latch) is the natural **sustain /
anchor-hold**: latch the current anchor, lift the hands, and now both are free to
walk a *different* layer. Note Walker's two-roles-for-two-hands becomes
two-roles-across-time.

## Honest frictions

These do not just qualify the design — they *shape* it.

- **Noise fights differential control.** Relative / pressure-delta reading
  amplifies exactly the noise `docs/buffer-circuit-notes.md` is trying to kill.
  Note Walker's discrete snapping is *itself* a noise-rejection strategy — which
  argues that grammar-snapping (#4) is not a nicety but load-bearing. The
  constraint set is what makes a noisy analog walk usable.
- **Anchor onset is ambiguous.** Note Walker decides the anchor by note *order*;
  a chord is pressed near-simultaneously. A short chord-onset window is needed to
  decide which keys are "the anchor" vs. "the walk" — a real design parameter.
- **Both hands committed.** This is why #6 (the sustain latch) matters: without
  it, the "free hand" economy that makes Note Walker effortless is simply
  unavailable on a chorded surface. The latch buys it back.
- **Dimensionality reduction is the actual gift.** 22 continuous channels is too
  many to consciously control. The anchor model's real value here is not melody —
  it is collapsing 22 dimensions into "direction and distance from a remembered
  state." That ergonomic win suits a chorded instrument *better* than a piano.

## The payoff

Note Walker taken literally is a melodic toy. Taken as a *philosophy* — relative
input, anchor-as-reference, constraint-snapping, path-dependent state, radical
economy — it is a surprisingly precise prescription for the one thing the
Stenophone was built to do and never quite resolved: **fuse the act of coding
with the act of performing, so the chord you type and the sound you shape are the
same continuous gesture.** The anchor is the idea Note Walker gives for free; the
Stenophone's continuous, bilateral, chorded body is what makes the walk worth
taking.
