export type TutorialNote = { note: string | '-'; beats: number };

export type Song = {
  name: string;
  notes: TutorialNote[];
};

export function songNote(value: string): TutorialNote {
  const [note, beats = "1"] = value.split(":");
  return { note, beats: Number(beats) };
}

function song(strings: string[]): TutorialNote[] {
  return strings.join(" ").split(" ").map(songNote);
}

export const SONGS: Record<string, Song> = {
  twinkle: {
    name: "Twinkle, Twinkle, Little Star",
    notes: song([
      "C4 C4 G4 G4 A4 A4 G4:2",
      "F4 F4 E4 E4 D4 D4 C4:2",
      "G4 G4 F4 F4 E4 E4 D4:2",
      "G4 G4 F4 F4 E4 E4 D4:2",
      "C4 C4 G4 G4 A4 A4 G4:2",
      "F4 F4 E4 E4 D4 D4 C4:2",
    ]),
  },
  jingle: {
    name: "Jingle Bells",
    notes: song([
      "E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4 D4 E4:4",
      "F4 F4 F4 F4 F4 E4 E4 E4 E4 D4 D4 E4 D4:2 G4:2",
    ]),
  },
  ode: {
    name: "Ode to Joy",
    notes: song(["E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2"]),
  },
  mary: {
    name: "Mary Had a Little Lamb",
    notes: song([
      "E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2",
      "E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:2",
    ]),
  },
  birthday: {
    name: "Happy Birthday",
    notes: song([
      "G3 G3:0.5 A3:1.5 G3:1.5 C4:1.5 B3:3",
      "G3 G3:0.5 A3:1.5 G3:1.5 D4:1.5 C4:3",
      "G3 G3:0.5 G4:1.5 E4:1.5 C4:1.5 B3:1.5 A3:3",
      "F4 F4:0.5 E4:1.5 C4:1.5 D4:1.5 C4:3",
    ]),
  },
  row: {
    name: "Row, Row, Row Your Boat",
    notes: song([
      "C4:1.5 C4:1.5 C4 D4:0.5 E4:1.5 E4 D4:0.5 E4 F4:0.5 G4:3.5",
      "C5:0.5 C5:0.5 C5:0.5",
      "G4:0.5 G4:0.5 G4:0.5",
      "E4:0.5 E4:0.5 E4:0.5",
      "C4:0.5 C4:0.5 C4:0.5",
      "G4 F4:0.5 E4 D4:0.5 C4:3",
    ]),
  },
  frere: {
    name: "Frère Jacques",
    notes: song([
      "C4 D4 E4 C4 C4 D4 E4 C4",
      "E4 F4 G4:2 E4 F4 G4:2",
      "G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4",
      "G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4",
      "C4 G3 C4:2 C4 G3 C4:2",
    ]),
  },
};
