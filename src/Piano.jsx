import cn from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import styles from "./Piano.module.scss";
import makeToneSalamander from "./samples/salamander";
import makeToneCasio from "./samples/casio";
import { useResizeObserver } from "./useResizeObserver";

const BLACK_KEY_SIZE = 0.7;
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const RENDER_DENSITY = 2;

export const INSTRUMENTS = {
  Salamader: makeToneSalamander,
  Casio: makeToneCasio,
  PolySynth: makeTonePolySynth,
};

const IDEAL_KEY_SIZE_PX = {
  normal: 36,
  large: 44,
  huge: 64,
};

const PIANO_COLORS = {
  'key-white': '#fff',
  'key-white-pressed': '#ccc',
  'key-black': '#000',
  'key-black-pressed': '#333',
  'key-border': '#000',
};


export function Piano({ className, vertical, dark, start, keySize, instrument }) {
  let tone = useRef();
  let [toneLoaded, setToneLoaded] = useState(false);
  let [canvas, setCanvas] = useState();
  let [container, setContainer] = useState(null);
  let pointers = useRef({});
  let [numWhiteKeys, setNumWhiteKeys] = useState(10);
  let [colors, setColors] = useState({});

  // Set up autdio library
  useEffect(() => {
    tone.current = INSTRUMENTS[instrument]();
    (async () => {
      await Tone.loaded();
      setToneLoaded(true);
    })();
    return () => (tone.current = null);
  }, [instrument]);

  // Get colors
  useEffect(() => {
    setTimeout(() => {
      let cs = window.getComputedStyle(document.body);
      setColors(Object.fromEntries(Object.keys(PIANO_COLORS).map(id =>
        [id, cs.getPropertyValue(`--color-${id}`)])));
    });
  }, [dark]);

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
      vertical,
      start,
      numWhiteKeys,
      colors,
    });
  }, [canvas, colors, vertical, start, numWhiteKeys]);

  useResizeObserver(
    container,
    () => {
      redrawPiano();
      let canvasLongSize = Math.max(canvas.offsetWidth, canvas.offsetHeight);
      let numWhiteKeys = Math.round(canvasLongSize / IDEAL_KEY_SIZE_PX[keySize]);
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
      return hitTest(x, y, { canvas, vertical, start, numWhiteKeys });
    },
    [canvas, vertical, start, numWhiteKeys]
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
  }, [redrawPiano, hitTestMemo]);

  if (!toneLoaded) {
    return <div className={cn(className, styles.loading)}>Loading...</div>;
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

    if (cur.note.indexOf("#") < 0) {
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

function layoutKeys({ canvas, vertical, start, numWhiteKeys }) {
  let width = canvas.width;
  let height = canvas.height;
  let canvasLongSize = !vertical ? width : height;
  let canvasShortSize = !vertical ? height : width;
  let longPosProp = !vertical ? 'x' : 'y';
  let shortPosProp = !vertical ? 'y' : 'x';
  let longSizeProp = !vertical ? 'w' : 'h';
  let shortSizeProp = !vertical ? 'h' : 'w';
  let notes = makeRange(start, numWhiteKeys);
  let whiteKeySize = (canvasLongSize + 1) / numWhiteKeys;
  let realLP = (longPos, keySize) => vertical ? canvasLongSize - longPos - keySize : longPos;
  let wkIndex = 0;
  return notes
    .map((fullNote) => {
      let { note, octave } = parseNote(fullNote);
      let black = note.endsWith("#");
      let n;
      let longPos = Math.round(wkIndex * whiteKeySize);
      let nextLongPos = Math.round((wkIndex + 1) * whiteKeySize);
      if (black) {
        let keySize = Math.round(whiteKeySize * BLACK_KEY_SIZE);
        n = {
          note: `${note}${octave}`,
          [longPosProp]: Math.round(realLP(longPos - keySize / 2, keySize)),
          [shortPosProp]: 0,
          [longSizeProp]: keySize,
          [shortSizeProp]: Math.round(canvasShortSize / 2),
          black,
        };
      } else {
        let keySize = Math.abs(nextLongPos - longPos);
        n = {
          note: `${note}${octave}`,
          [longPosProp]: realLP(longPos - 0.5, keySize),
          [shortPosProp]: -1,
          [longSizeProp]: keySize,
          [shortSizeProp]: canvasShortSize + 1,
          black,
        };
        ++wkIndex;
      }
      return n;
    })
    .sort((a, b) => (a.black ? -1 : b.black ? 1 : 0));
}

function hitTest(testX, testY, { canvas, vertical, start, numWhiteKeys }) {
  let layout = layoutKeys({ canvas, vertical, start, numWhiteKeys });
  let tl = canvas.getBoundingClientRect();
  testX -= tl.left;
  testY -= tl.top;
  testX *= RENDER_DENSITY;
  testY *= RENDER_DENSITY;
  for (let { note, x, y, w, h } of layout) {
    if (testX >= x && testX < x + w && testY >= y && testY < y + h) {
      return note;
    }
  }
  return null;
}

function drawPiano({ pointers, canvas, vertical, start, numWhiteKeys, colors }) {
  let layout = layoutKeys({ canvas, vertical, start, numWhiteKeys }).reverse();
  let pressedNotes = new Set(Object.values(pointers));
  let ctx = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = colors['key-border'];
  ctx.lineWidth = Math.round(Math.max(2 * RENDER_DENSITY, 1));
  let corner = 5 * RENDER_DENSITY;

  for (let { x, y, w, h, black, note } of layout) {
    ctx.beginPath();
    if (black) {
      if (vertical) {
        ctx.roundRect(x, y - 0.5, w + 0.5, h + 1, [0, corner, corner, 0]);
      } else {
        ctx.roundRect(x - 0.5, y, w + 1, h + 0.5, [0, 0, corner, corner]);
      }
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
    if (pressedNotes.has(note)) {
      ctx.fillStyle = black ? colors['key-black-pressed'] : colors['key-white-pressed'];
      ctx.fill();
    } else {
      ctx.fillStyle = black ? colors['key-black'] : colors['key-white'];
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
