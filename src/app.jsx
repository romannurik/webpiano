import React, { useState, useMemo, useEffect, useRef } from "react";
import * as Tone from "tone";
import "./styles.css";

const BLACK_KEY_WIDTH = 0.7;
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function App() {
  return <Piano from="C4" to="G5" />;
}

function Piano({ from, to }) {
  let tone = useRef();
  let [canvas, setCanvas] = useState();
  let [pointers, setPointers] = useState({});
  let [toneLoaded, setToneLoaded] = useState(false);

  let lastPressedNotes = useRef({});

  let pressedNotes = useMemo(() => {
    let pressed = {};
    for (let { x, y } of Object.values(pointers)) {
      let note = hitTest(x, y, { canvas, from, to });
      if (note) {
        pressed[note] = true;
      }
    }
    return pressed;
  }, [canvas, pointers]);

  useEffect(() => {
    for (let note in pressedNotes) {
      if (!lastPressedNotes.current[note]) {
        // new note!
        tone.current.triggerAttack(note);
      }
    }
    for (let note in lastPressedNotes.current) {
      if (!pressedNotes[note]) {
        // unpressed
        tone.current.triggerRelease(note);
      }
    }
    lastPressedNotes.current = pressedNotes;
  }, [pressedNotes]);

  useEffect(() => {
    if (!canvas) return;
    if (!canvas) return;
    let resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawPiano({ pressedNotes, canvas, from, to });
    };
    resize();
    drawPiano({ pressedNotes, canvas, from, to });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvas, pressedNotes]);

  useEffect(() => {
    tone.current = makeToneSalamander();
    (async () => {
      await Tone.loaded();
      setToneLoaded(true);
    })();
    return () => (tone.current = null);
  }, []);

  useEffect(() => {
    let cancel = (ev) => {
      let { [ev.pointerId]: _, ...otherPointers } = pointers;
      setPointers(otherPointers);
    };
    let move = (ev) => {
      if (!pointers[ev.pointerId]) return; // not pressed
      setPointers({
        ...pointers,
        [ev.pointerId]: { x: ev.clientX, y: ev.clientY },
      });
    };
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("pointermove", move);
    };
  });

  if (!toneLoaded) {
    return "Loading...";
  }

  return (
    <>
      <canvas
        onClick={(ev) => {
          document.body.requestFullscreen();
        }}
        ref={(node) => setCanvas(node)}
        className="piano"
        onPointerDown={(ev) => {
          setPointers({
            ...pointers,
            [ev.pointerId]: { x: ev.clientX, y: ev.clientY },
          });
        }}
        onContextMenu={(ev) => {
          ev.preventDefault();
        }}
      />
    </>
  );
}

function parseNote(s) {
  let [_, note, octave] = s.match(/(.+)(\d)/) || [];
  return { note, octave: parseInt(octave) };
}

function noteStr({ note, octave }) {
  return `${note}${octave}`;
}

function makeRange(from, to) {
  to = parseNote(to);
  let notes = [];
  let cur = parseNote(from);
  let i = 0;
  while (++i < 1000) {
    notes.push(noteStr(cur));
    if (cur.note === to.note && cur.octave === to.octave) {
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

function layoutKeys({ canvas, from, to }) {
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  let notes = makeRange(from, to);
  let numWhiteNotes = notes.filter((n) => n.indexOf("#") < 0).length;
  let whiteKeyWidth = width / numWhiteNotes;
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

function hitTest(testX, testY, { canvas, from, to }) {
  let layout = layoutKeys({ canvas, from, to });
  let start = canvas.getBoundingClientRect();
  testX -= start.left;
  testY -= start.top;
  for (let { note, x, y, w, h } of layout) {
    if (testX >= x && testX < x + w && testY >= y && testY < y + h) {
      return note;
    }
  }
  return null;
}

function drawPiano({ pressedNotes, canvas, from, to }) {
  let layout = layoutKeys({ canvas, from, to }).reverse();
  let ctx = canvas.getContext("2d");
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  ctx.clearRect(0, 0, width, height);
  for (let { x, y, w, h, black, note } of layout) {
    ctx.beginPath();
    if (black) {
      ctx.roundRect(x, y, w, h, [0, 0, 5, 5]);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
    if (pressedNotes[note]) {
      ctx.fillStyle = black ? "#888" : "#ddd";
      ctx.fill();
    } else if (black) {
      ctx.fillStyle = "#333";
      ctx.fill();
    }
    ctx.strokeStyle = "1px solid black";
    ctx.stroke();
  }
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
