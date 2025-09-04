export const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
export const WHITE_NOTES = NOTES.filter((n) => n.length === 1);

export function parseNote(s) {
  let [_, note, octave] = s.match(/(.+)(\d)/) || [];
  return { note, octave: parseInt(octave) };
}

export function noteStr({ note, octave }) {
  return `${note}${octave}`;
}

export function noteDistance(a, b) {
  let { note: aNote, octave: aOctave } = parseNote(a);
  let { note: bNote, octave: bOctave } = parseNote(b);
  return (bOctave - aOctave) * 12 + NOTES.indexOf(bNote) - NOTES.indexOf(aNote);
}

export function offsetToNote(offset) {
  const octave = Math.floor(offset / 7);
  const note = WHITE_NOTES[Math.floor(offset) - octave * 7];
  return { note, octave };
}

export function optimalChordInversion(chord, centerNote) {
  let { octave: centerOctave } = parseNote(centerNote);
  return chord.map((note) => {
    // find the best octave for this note
    let { note: n } = parseNote(note);
    let candidates = [-1, 0, 1]
      .map((oct) => {
        let note = noteStr({ note: n, octave: centerOctave + oct });
        let dist = Math.abs(noteDistance(note, centerNote));
        return { note, dist };
      })
      .sort((a, b) => a.dist - b.dist);
    return candidates[0].note;
  });
}

export function deltaNote(note, offset) {
  let { note: n, octave } = parseNote(note);
  // TODO: boundaries (octave below 1, octave over N)
  return noteStr({
    note: NOTES[(NOTES.indexOf(n) + 12 + offset) % 12],
    octave: octave + Math.floor((NOTES.indexOf(n) + offset) / 12),
  });
}

export function diffNotes(before, after) {
  let added = new Set(after.filter((n) => !before.includes(n)));
  let removed = new Set(before.filter((n) => !after.includes(n)));
  return { added, removed };
}

export function makeChord(scale, ...nums) {
  return nums.map((n) => scale[n - 1]);
}

export function makeScale(note, minor) {
  return [
    note,
    deltaNote(note, 2),
    deltaNote(note, minor ? 3 : 4),
    deltaNote(note, 5),
    deltaNote(note, 7),
    deltaNote(note, minor ? 8 : 9),
    deltaNote(note, minor ? 10 : 11),
    deltaNote(note, 12),
  ];
}

export function makeNoteRangeForLayout(offset, numWhiteKeys) {
  // let to = parseNote(to);
  let to = {};
  let notes = [];
  let cur = offsetToNote(offset);
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
    if (idx === 12 - 1) {
      cur = { octave: cur.octave + 1, note: NOTES[0] };
    } else {
      cur = { octave: cur.octave, note: NOTES[idx + 1] };
    }
  }
  return notes;
}
