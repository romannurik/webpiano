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

export type ParsedNote = { note: string; octave: number };

export function parseNote(s: string): ParsedNote {
  let [_, note, octave] = s.match(/(.+)(\d)/) || [];
  return { note, octave: parseInt(octave) };
}

export function noteStr({ note, octave }: ParsedNote) {
  return `${note}${octave}`;
}

export function noteDistance(a: string, b: string) {
  let { note: aNote, octave: aOctave } = parseNote(a);
  let { note: bNote, octave: bOctave } = parseNote(b);
  return (bOctave - aOctave) * 12 + NOTES.indexOf(bNote) - NOTES.indexOf(aNote);
}

export function offsetToNote(offset: number) {
  const octave = Math.floor(offset / 7);
  const note = WHITE_NOTES[Math.floor(offset) - octave * 7];
  return { note, octave };
}

export function optimalChordInversion(chord: string[], centerNote: string) {
  let { octave: centerOctave } = parseNote(centerNote);
  return chord.map((note: string) => {
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

export function deltaNote(note: string, offset: number) {
  let { note: n, octave } = parseNote(note);
  // TODO: boundaries (octave below 1, octave over N)
  return noteStr({
    note: NOTES[(NOTES.indexOf(n) + 12 + offset) % 12],
    octave: octave + Math.floor((NOTES.indexOf(n) + offset) / 12),
  });
}

export function diffNotes(before: string[], after: string[]) {
  let added = new Set(after.filter((n) => !before.includes(n)));
  let removed = new Set(before.filter((n) => !after.includes(n)));
  return { added, removed };
}

export function makeChord(scale: string[], ...nums: number[]) {
  return nums.map((n) => scale[n - 1]);
}

export function makeScale(note: string, minor?: boolean) {
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

export function makeNoteRangeForLayout(offset: number, numWhiteKeys: number) {
  // let to = parseNote(to);
  let to: ParsedNote = { note: "C", octave: -1 };
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
