# Learned chording: a Chordata-inspired direction for the Stenophone

*Design hunch, 2026-06-19. Speculative — not yet scoped or built.*

## The hunch in one line

The Stenophone's chords are hand-coined and frozen; **Chordata** shows how a
chord vocabulary could *coin itself* from performance — and even collapse
different routes to the same result into a single gesture.

## Where it comes from

Chordata is an incremental live-programming interpreter built on *shortcut
memoization*: it watches a program execute, discovers step-sequences that
recur, and mints each into a single rewrite rule (a "shortcut") that fuses many
reduction steps into one. The vocabulary of shortcuts is **learned from
execution traces**, automatically, while the system runs.

The Stenophone does the structurally identical thing on the *input* side — a
combination of keypresses freezes into one chord, which expands into a code
fragment — but its vocabulary is the opposite of Chordata's: the performer
**hand-authors the Plover dictionary up front**, static, designed before the
performance ever happens.

So the rhyme isn't the shared word "chord". It's this:

> **Chordata is what the Stenophone's dictionary would be if it learned itself.**

## What it would mean concretely

1. **Self-extending vocabulary.** Instead of designing every chord in advance,
   the instrument watches what you actually play, notices the code/gesture
   phrases you keep rebuilding, and proposes a single chord for each — an
   instrument that grows more fluent the more you perform on it. This lands
   directly on the paper-cited framing of the instrument as a *cognitive
   extension* (Magnusson 2009) and the ICLC paper's own open question about
   gestures "recorded during chord input".

2. **Distal-similarity chording (the deep part).** Chordata's hardest trick is
   matching two *structurally different* execution routes that reach the *same*
   result. Retargeted to performance, that becomes: notice you keep arriving at
   the same Tidal pattern via *different* chord routes, and mint one chord for
   the destination — shortening the path to a result regardless of how you got
   there before.

## Where the analogy honestly breaks

Chordata learns over **execution traces** — the output/semantic side. To put it
in the Stenophone you would retarget the same learning machinery onto the
**input/gesture/edit trace** instead. That is a real adaptation, not a
copy-paste:

- The **principle** transplants: observe repetition → mint a compound shortcut →
  extend the vocabulary with it.
- The **mechanism** is reusable but must be re-pointed: the discrimination-tree
  pattern matcher and the "which shortcuts are worth keeping" value heuristics
  would operate over performance/edit events, not CEK machine states.
- The **payoff differs.** Chordata's literal win is runtime speed (up to
  ~13× on Hazel traces). The Stenophone's bottleneck is the *human gesture*, not
  interpreter latency — so the interesting payoff here is *expressive fluency and
  a self-adapting vocabulary*, not raw execution speed.

## Two readings, kept distinct

- **(A) Literal / runtime.** Drop Chordata in as the interpreter so live-edited
  Tidal re-evaluates faster. Mechanically valid, musically marginal (latency is
  not the Stenophone's constraint).
- **(B) Metaphorical / learned chording.** Borrow the
  *learn-shortcuts-from-repeated-patterns* principle for the input side. This is
  the direction worth pursuing.

## Smallest next experiment

Log a real performance's chord/edit stream, then offline: detect the most
frequently repeated chord-sequences and the distinct routes that reach identical
Tidal patterns. If a handful of high-value candidate chords fall out of a single
session, the learned-vocabulary idea has legs and is worth wiring into the live
Plover/`web/index.js` path. If nothing recurs, the hunch is pretty but empty.

## Reference

Marisa Kirisame, Thomas J. Porter, Ruqing Yang, Jianqiu Zhao, Yudi Wu, Ivan Wei,
Cyrus Omar, and Pavel Panchekha. "Incremental Live Programming via Shortcut
Memoization." arXiv:2603.19560v1 [cs.PL], March 2026.
<https://arxiv.org/abs/2603.19560>

Related: the Stenophone (Armitage & McPherson, ICLC 2017),
`docs/stenophone_iclc2017.pdf`.
