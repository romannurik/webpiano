import { GuitarIcon, KeyboardMusicIcon, PianoIcon, WindIcon } from "lucide-react";
import * as Tone from "tone";
import makeToneCasio from "./samples/casio";
import makeToneSalamander from "./samples/salamander";
import { SampleLibrary } from "./tonejs-instruments";
import { StringsIcon, TrumpetIcon } from "./MusicIcons";

export const CATEGORY_ICONS: Record<string, React.FC> = {
  Keyboard: KeyboardMusicIcon,
  String: StringsIcon,
  Guitar: GuitarIcon,
  Woodwind: WindIcon,
  Brass: TrumpetIcon,
};

export type Instrument = {
  load: () => Tone.Sampler | Tone.PolySynth;
  title?: string;
  icon?: React.FC;
  category: string;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  // Keyboard
  Salamader: {
    load: makeToneSalamander,
    title: 'Piano',
    icon: PianoIcon,
    category: "Keyboard",
  },
  Piano2: {
    load: makeInstrument("piano"),
    title: 'Piano 2',
    category: "Keyboard",
  },
  Casio: {
    load: makeToneCasio,
    title: 'Piano 3',
    category: "Keyboard",
  },
  PolySynth: {
    load: makeTonePolySynth,
    category: "Keyboard",
  },
  Organ: {
    load: makeInstrument("organ"),
    category: "Keyboard",
  },
  Harmonium: {
    load: makeInstrument("harmonium"),
    category: "Keyboard",
  },
  Xylophone: {
    load: makeInstrument("xylophone"),
    category: "Keyboard",
  },
  // String
  Cello: {
    load: makeInstrument("cello"),
    category: "String",
  },
  Contrabass: {
    load: makeInstrument("contrabass"),
    category: "String",
  },
  Violin: {
    load: makeInstrument("violin"),
    category: "String",
  },
  // Guitar
  BassElectric: {
    load: makeInstrument("bass-electric"),
    title: 'Electric Bass',
    category: "Guitar",
  },
  GuitarAcoustic: {
    load: makeInstrument("guitar-acoustic"),
    title: 'Acoustic Guitar',
    category: "Guitar",
  },
  GuitarElectric: {
    load: makeInstrument("guitar-electric"),
    title: 'Electric Guitar',
    category: "Guitar",
  },
  GuitarNylon: {
    load: makeInstrument("guitar-nylon"),
    title: 'Nylon Guitar',
    category: "Guitar",
  },
  Harp: {
    load: makeInstrument("harp"),
    category: "Guitar",
  },
  // Woodwind
  Bassoon: {
    load: makeInstrument("trumpet"),
    category: "Woodwind",
  },
  Clarinet: {
    load: makeInstrument("bassoon"),
    category: "Woodwind",
  },
  Flute: {
    load: makeInstrument("flute"),
    category: "Woodwind",
  },
  Saxophone: {
    load: makeInstrument("saxophone"),
    category: "Woodwind",
  },
  // Brass
  FrenchHorn: {
    load: makeInstrument("french-horn"),
    title: 'French Horn',
    category: "Brass",
  },
  Trombone: {
    load: makeInstrument("trombone"),
    category: "Brass",
  },
  Trumpet: {
    load: makeInstrument("trumpet"),
    category: "Brass",
  },
  Tuba: {
    load: makeInstrument("tuba"),
    category: "Brass",
  },
};

export const CATEGORIES = [
  ...new Set(Object.values(INSTRUMENTS).map((c) => c.category)),
];

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

function makeInstrument(name: string) {
  return () => {
    let instruments = SampleLibrary.load({
      instruments: [name],
      baseUrl: "/samples-tonejs-instruments/",
    });
    let instrument = instruments[name];
    instrument.toDestination();
    return instrument;
  };
}
