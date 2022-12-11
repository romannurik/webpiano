import * as Tone from 'tone';
import A0 from './A0.mp3';
import A1 from './A1.mp3';
import A2 from './A2.mp3';
import A3 from './A3.mp3';
import A4 from './A4.mp3';
import A5 from './A5.mp3';
import A6 from './A6.mp3';
import A7 from './A7.mp3';
import C1 from './C1.mp3';
import C2 from './C2.mp3';
import C3 from './C3.mp3';
import C4 from './C4.mp3';
import C5 from './C5.mp3';
import C6 from './C6.mp3';
import C7 from './C7.mp3';
import C8 from './C8.mp3';
import Ds1 from './Ds1.mp3';
import Ds2 from './Ds2.mp3';
import Ds3 from './Ds3.mp3';
import Ds4 from './Ds4.mp3';
import Ds5 from './Ds5.mp3';
import Ds6 from './Ds6.mp3';
import Ds7 from './Ds7.mp3';
import Fs1 from './Fs1.mp3';
import Fs2 from './Fs2.mp3';
import Fs3 from './Fs3.mp3';
import Fs4 from './Fs4.mp3';
import Fs5 from './Fs5.mp3';
import Fs6 from './Fs6.mp3';
import Fs7 from './Fs7.mp3';

export default function () {
  return new Tone.Sampler({
    urls: {
      A0,
      A1,
      A2,
      A3,
      A4,
      A5,
      A6,
      A7,
      C1,
      C2,
      C3,
      C4,
      C5,
      C6,
      C7,
      C8,
      "D#1": Ds1,
      "D#2": Ds2,
      "D#3": Ds3,
      "D#4": Ds4,
      "D#5": Ds5,
      "D#6": Ds6,
      "D#7": Ds7,
      "F#1": Fs1,
      "F#2": Fs2,
      "F#3": Fs3,
      "F#4": Fs4,
      "F#5": Fs5,
      "F#6": Fs6,
      "F#7": Fs7,
    },
    release: 1,
  }).toDestination();
}
