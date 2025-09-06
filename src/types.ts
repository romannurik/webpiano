export type ChordType = 'major' | 'minor';

export type PianoConfig = {
  offset: number;
  keySize: "normal" | "large" | "huge";
  instrument: string;
  dark?: boolean;
  chordMode?: boolean;
  chordModeConfig?: Record<string, ChordType>;
};
