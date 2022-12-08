import cn from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import styles from "./Piano.module.scss";
import { useResizeObserver } from "./useResizeObserver";

const BLACK_KEY_WIDTH = 0.7;
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const RENDER_DENSITY = 2;

export const INSTRUMENTS = {
  Salamader: makeToneSalamander,
  Casio: makeToneCasio,
  PolySynth: makeTonePolySynth,
};

const IDEAL_KEY_WIDTH_PX = {
  normal: 64,
  large: 80,
  huge: 112,
};

export function Piano({ className, start, keySize, instrument }) {
  let tone = useRef();
  let [toneLoaded, setToneLoaded] = useState(false);
  let [canvas, setCanvas] = useState();
  let [container, setContainer] = useState(null);
  let pointers = useRef({});
  let [numWhiteKeys, setNumWhiteKeys] = useState(10);

  // Set up autdio library
  useEffect(() => {
    tone.current = INSTRUMENTS[instrument]();
    (async () => {
      await Tone.loaded();
      setToneLoaded(true);
    })();
    return () => (tone.current = null);
  }, [instrument]);

  // Drawing and sizing
  let redrawPiano = useCallback(() => {
    if (
      canvas.width !== canvas.offsetWidth * RENDER_DENSITY ||
      canvas.height !== canvas.offsetHeight * RENDER_DENSITY
    ) {
      canvas.width = canvas.offsetWidth * RENDER_DENSITY;
      canvas.height = canvas.offsetHeight * RENDER_DENSITY;
    }
    drawPiano({
      pointers: pointers.current,
      canvas,
      start,
      numWhiteKeys,
    });
  }, [canvas, start, numWhiteKeys]);

  useResizeObserver(
    container,
    () => {
      redrawPiano();
      let numWhiteKeys = Math.round(canvas.width / IDEAL_KEY_WIDTH_PX[keySize]);
      numWhiteKeys = Math.max(5, numWhiteKeys); // minimum
      if (numWhiteKeys % 7 !== 0 && numWhiteKeys % 7 !== 4) {
        // we always start on an F... let's make sure we end on a B or E
        // to avoid any half black keys
        if (numWhiteKeys % 7 < 4) {
          // round down to end on an E
          numWhiteKeys -= numWhiteKeys % 7;
        } else {
          // round down to end on a B
          numWhiteKeys -= numWhiteKeys % 7 - 4;
        }
      }
      setNumWhiteKeys(numWhiteKeys);
    },
    [redrawPiano, keySize, canvas]
  );

  useEffect(() => {
    if (!canvas) return;
    redrawPiano();
  }, [canvas, redrawPiano]);

  // Pressed key handling
  let hitTestMemo = useCallback(
    (x, y) => {
      return hitTest(x, y, { canvas, start, numWhiteKeys });
    },
    [canvas, start, numWhiteKeys]
  );

  useEffect(() => {
    let cancel = (ev) => {
      // lifting finger
      let note = pointers.current[ev.pointerId];
      if (!note) return;
      delete pointers.current[ev.pointerId];
      if (Object.values(pointers.current).indexOf(note) < 0) {
        // no other pointers pressing this note, trigger release
        tone.current.triggerRelease(note);
        redrawPiano();
      }
    };
    let move = (ev) => {
      // moving your finger
      let previousNote = pointers.current[ev.pointerId];
      if (!previousNote) return; // not pressed
      let newNote = hitTestMemo(ev.clientX, ev.clientY);
      if (previousNote === newNote) return;
      // previous note
      delete pointers.current[ev.pointerId];
      let notesPressed = Object.values(pointers.current);
      if (notesPressed.indexOf(previousNote) < 0) {
        // no other pointers pressing previous note, trigger release
        tone.current.triggerRelease(previousNote);
        redrawPiano();
      }
      // new note
      if (!newNote) return;
      let noteAlreadyPressed = notesPressed.indexOf(newNote) >= 0;
      pointers.current[ev.pointerId] = newNote;
      if (!noteAlreadyPressed) {
        tone.current.triggerAttack(newNote);
        redrawPiano();
      }
    };
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("pointermove", move);
    };
  }, [hitTestMemo]);

  if (!toneLoaded) {
    return <div className={className}>Loading...</div>;
  }

  return (
    <div
      className={cn(className, styles.container)}
      ref={(node) => setContainer(node)}
    >
      <canvas
        ref={(node) => setCanvas(node)}
        className={styles.piano}
        onPointerDown={(ev) => {
          // pressing finger
          let note = hitTestMemo(ev.clientX, ev.clientY);
          if (!note) return;
          let noteAlreadyPressed = Object.values(pointers.current).indexOf(note) >= 0;
          pointers.current[ev.pointerId] = note;
          if (!noteAlreadyPressed) {
            tone.current.triggerAttack(note);
            redrawPiano();
          }
        }}
        onContextMenu={(ev) => {
          ev.preventDefault();
        }}
      />
    </div>
  );
}

function parseNote(s) {
  let [_, note, octave] = s.match(/(.+)(\d)/) || [];
  return { note, octave: parseInt(octave) };
}

function noteStr({ note, octave }) {
  return `${note}${octave}`;
}

function makeRange(start, numWhiteKeys) {
  // let to = parseNote(to);
  let to = {};
  let notes = [];
  let cur = parseNote(start);
  let i = 0;
  let wk = 0;
  while (++i < 1000) {
    notes.push(noteStr(cur));
    if (cur.note === to.note && cur.octave === to.octave) {
      break;
    }

    if (cur.note.indexOf("#") >= 0) {
      ++wk;
    }
    if (wk >= numWhiteKeys) {
      break;
    }

    let idx = NOTES.indexOf(cur.note);
    if (idx === NOTES.length - 1) {
      cur = { octave: cur.octave + 1, note: NOTES[0] };
    } else {
      cur = { octave: cur.octave, note: NOTES[idx + 1] };
    }
  }
  return notes;
}

function layoutKeys({ canvas, start, numWhiteKeys }) {
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  let notes = makeRange(start, numWhiteKeys);
  let whiteKeyWidth = width / numWhiteKeys;
  let x = 0;
  return notes
    .map((fullNote) => {
      let { note, octave } = parseNote(fullNote);
      let black = note.endsWith("#");
      let keyWidth = black ? whiteKeyWidth * BLACK_KEY_WIDTH : whiteKeyWidth;
      let n = {
        note: `${note}${octave}`,
        x: black ? x - keyWidth / 2 : x,
        y: 0,
        w: keyWidth,
        h: black ? height / 2 : height,
        black,
      };
      x += black ? 0 : whiteKeyWidth;
      return n;
    })
    .sort((a, b) => (a.black ? -1 : b.black ? 1 : 0));
}

function hitTest(testX, testY, { canvas, start, numWhiteKeys }) {
  let layout = layoutKeys({ canvas, start, numWhiteKeys });
  let tl = canvas.getBoundingClientRect();
  testX -= tl.left;
  testY -= tl.top;
  for (let { note, x, y, w, h } of layout) {
    if (testX >= x && testX < x + w && testY >= y && testY < y + h) {
      return note;
    }
  }
  return null;
}

function drawPiano({ pointers, canvas, start, numWhiteKeys }) {
  let layout = layoutKeys({ canvas, start, numWhiteKeys }).reverse();
  let pressedNotes = new Set(Object.values(pointers));
  let ctx = canvas.getContext("2d");
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  ctx.save();
  ctx.scale(RENDER_DENSITY, RENDER_DENSITY);
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "1px solid red";

  for (let { x, y, w, h, black, note } of layout) {
    ctx.beginPath();
    if (black) {
      ctx.roundRect(Math.round(x), y, w, h, [0, 0, 5, 5]);
    } else {
      ctx.rect(Math.round(x), y, w, h);
    }
    ctx.closePath();
    if (pressedNotes.has(note)) {
      ctx.fillStyle = black ? "#888" : "#ddd";
      ctx.fill();
    } else if (black) {
      ctx.fillStyle = "#333";
      ctx.fill();
    }
    ctx.stroke();
  }

  ctx.restore();
}

function makeTonePolySynth() {
  return new Tone.PolySynth(Tone.MonoSynth, {
    volume: -8,
    oscillator: {
      type: "square8",
    },
    envelope: {
      attack: 0.05,
      decay: 0.3,
      sustain: 0.4,
      release: 0.8,
    },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.7,
      sustain: 0.1,
      release: 0.8,
      baseFrequency: 300,
      octaves: 4,
    },
  }).toDestination();
}

function makeToneCasio() {
  return new Tone.Sampler({
    urls: {
      A1: "A1.mp3",
      A2: "A2.mp3",
      "A#1": "As1.mp3",
      B1: "B1.mp3",
      C2: "C2.mp3",
      "C#2": "Cs2.mp3",
      D2: "D2.mp3",
      "D#2": "Ds2.mp3",
      E2: "E2.mp3",
      F2: "F2.mp3",
      "F#2": "Fs2.mp3",
      G2: "G2.mp3",
      "G#1": "Gs1.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/casio/",
  }).toDestination();
}

function makeToneSalamander() {
  return new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
      C6: "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      A6: "A6.mp3",
      C7: "C7.mp3",
      "D#7": "Ds7.mp3",
      "F#7": "Fs7.mp3",
      A7: "A7.mp3",
      C8: "C8.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();
}
