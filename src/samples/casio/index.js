import * as Tone from 'tone';
import A1 from './A1.mp3';
import A2 from './A2.mp3';
import As1 from './As1.mp3';
import B1 from './B1.mp3';
import C2 from './C2.mp3';
import Cs2 from './Cs2.mp3';
import D2 from './D2.mp3';
import Ds2 from './Ds2.mp3';
import E2 from './E2.mp3';
import F2 from './F2.mp3';
import Fs2 from './Fs2.mp3';
import G2 from './G2.mp3';
import Gs1 from './Gs1.mp3';

export default function () {
  return new Tone.Sampler({
    urls: {
      A1,
      A2,
      B1,
      C2,
      D2,
      E2,
      F2,
      G2,
      "A#1": As1,
      "C#2": Cs2,
      "D#2": Ds2,
      "F#2": Fs2,
      "G#1": Gs1,
    },
    release: 1,
  }).toDestination();
}
