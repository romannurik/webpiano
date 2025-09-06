import cn from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { makeNoteRangeForLayout, noteStr, parseNote } from "./piano-util";
import styles from "./Piano.module.scss";
import type { PianoConfig } from "./types";
import { useResizeObserver } from "./useResizeObserver";

const BLACK_KEY_SIZE = 0.7;

const RENDER_DENSITY = 2;

const IDEAL_KEY_SIZE_PX = {
  normal: 44,
  large: 64,
  huge: 80,
};

const LABEL_FONT = "Inter";

const DEFAULT_PIANO_COLORS = {
  "key-white": "#f00",
  "key-white-pressed": "#f00",
  "key-white-highlight": "#f00",
  "key-white-label": "#f00",
  "key-black": "#f00",
  "key-black-pressed": "#f00",
  "key-black-highlight": "#f00",
  "key-black-label": "#f00",
  "key-border": "#f00",
} as const;

type PianoColorKey = keyof typeof DEFAULT_PIANO_COLORS;

export type KeyAnnotation = {
  label?: string;
};

export function Piano({
  className,
  vertical,
  dark,
  offset,
  keySize,
  onResize,
  loading,
  highlightNotes,
  annotations,
  onNoteDown,
  onNoteUp,
}: {
  className?: string;
  vertical?: boolean;
  onResize?: (numWhiteKeys: number) => void;
  loading?: boolean;
  highlightNotes?: string[];
  annotations?: Record<string, KeyAnnotation>;
  onNoteDown?: (...notes: string[]) => void;
  onNoteUp?: (...notes: string[]) => void;
} & PianoConfig) {
  offset = Math.max(0, Math.min(108, offset));

  // drawing and layout
  let [canvas, setCanvas] = useState<HTMLCanvasElement>();
  let [numWhiteKeys, setNumWhiteKeys] = useState(10);
  let [colors, setColors] =
    useState<Record<PianoColorKey, string>>(DEFAULT_PIANO_COLORS);

  // elements
  let [container, setContainer] = useState<HTMLElement>();

  // track active notes + pointers
  let pointers = useRef<Record<number, string>>({});

  // Get colors
  useEffect(() => {
    setTimeout(() => {
      let cs = window.getComputedStyle(document.body);
      setColors(
        Object.fromEntries(
          Object.keys(DEFAULT_PIANO_COLORS).map((id) => [
            id,
            cs.getPropertyValue(`--color-${id}`),
          ])
        ) as Record<PianoColorKey, string>
      );
    });
  }, [dark]);

  // Drawing and sizing
  let redrawPiano = useCallback(() => {
    if (!canvas) {
      return;
    }
    if (
      canvas.width !== canvas.offsetWidth * RENDER_DENSITY ||
      canvas.height !== canvas.offsetHeight * RENDER_DENSITY
    ) {
      canvas.width = canvas.offsetWidth * RENDER_DENSITY;
      canvas.height = canvas.offsetHeight * RENDER_DENSITY;
    }
    drawPiano({
      pointers: pointers.current,
      highlightNotes,
      canvas,
      vertical,
      offset,
      numWhiteKeys,
      annotations,
      colors,
    });
  }, [
    canvas,
    colors,
    vertical,
    offset,
    numWhiteKeys,
    highlightNotes,
    annotations,
  ]);

  useResizeObserver(
    container,
    () => {
      if (!canvas) return;
      redrawPiano();
      let canvasLongSize = Math.max(canvas.offsetWidth, canvas.offsetHeight);
      let numWhiteKeys = Math.round(
        canvasLongSize / IDEAL_KEY_SIZE_PX[keySize]
      );
      numWhiteKeys = Math.max(5, numWhiteKeys); // minimum
      setNumWhiteKeys(numWhiteKeys);
    },
    [redrawPiano, keySize, canvas]
  );

  useEffect(() => {
    onResize?.(numWhiteKeys);
  }, [numWhiteKeys, onResize]);

  useEffect(() => {
    if (!canvas) return;
    redrawPiano();
  }, [canvas, redrawPiano]);

  // Pressed key handling
  let hitTestMemo = useCallback(
    (x: number, y: number) =>
      hitTest(x, y, { canvas: canvas!, vertical, offset, numWhiteKeys }),
    [canvas, vertical, offset, numWhiteKeys]
  );

  useEffect(() => {
    let cancel = (ev: PointerEvent) => {
      // lifting finger
      let note = pointers.current[ev.pointerId];
      if (!note) return;
      delete pointers.current[ev.pointerId];
      if (Object.values(pointers.current).indexOf(note) < 0) {
        // no other pointers pressing this note, trigger release
        onNoteUp?.(note);
        redrawPiano();
      }
    };
    let move = (ev: PointerEvent) => {
      // moving your finger
      let previousNote = pointers.current[ev.pointerId];
      if (!previousNote) return; // not pressed
      let newNote = hitTestMemo(ev.clientX, ev.clientY);
      if (previousNote === newNote) return;
      // previous note
      delete pointers.current[ev.pointerId];
      let pressedNotes = Object.values(pointers.current);
      if (pressedNotes.indexOf(previousNote) < 0) {
        // no other pointers pressing previous note, trigger release
        onNoteUp?.(previousNote);
        redrawPiano();
      }
      // new note
      if (!newNote) return;
      let noteAlreadyPressed = pressedNotes.indexOf(newNote) >= 0;
      pointers.current[ev.pointerId] = newNote;
      if (!noteAlreadyPressed) {
        onNoteDown?.(newNote);
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
  }, [onNoteDown, onNoteUp, redrawPiano, hitTestMemo]);

  useEffect(() => {
    if (canvas && !navigator.userAgent.includes('Android')) {
      canvas.addEventListener('contextmenu', ev => {
        ev.preventDefault();
      })
    }
  }, [canvas]);

  if (loading) {
    return (
      <div className={cn(className, styles.loading)}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      className={cn(className, styles.container)}
      ref={(node) => setContainer(node || undefined)}
    >
      <canvas
        ref={(node) => setCanvas(node || undefined)}
        className={styles.piano}
        onPointerDown={(ev) => {
          // pressing finger
          let note = hitTestMemo(ev.clientX, ev.clientY);
          if (!note) return;
          let noteAlreadyPressed =
            Object.values(pointers.current).indexOf(note) >= 0;
          pointers.current[ev.pointerId] = note;
          if (!noteAlreadyPressed) {
            onNoteDown?.(note);
            redrawPiano();
          }
        }}
      />
    </div>
  );
}

interface KeyLayout {
  note: string;
  black: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

function layoutKeys({
  canvas,
  vertical,
  offset,
  numWhiteKeys,
}: {
  canvas: HTMLCanvasElement;
  vertical?: boolean;
  offset: number;
  numWhiteKeys: number;
}): KeyLayout[] {
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  let canvasLongSize = !vertical ? width : height;
  let canvasShortSize = !vertical ? height : width;
  let longPosProp = !vertical ? ("x" as const) : ("y" as const);
  let shortPosProp = !vertical ? ("y" as const) : ("x" as const);
  let longSizeProp = !vertical ? ("w" as const) : ("h" as const);
  let shortSizeProp = !vertical ? ("h" as const) : ("w" as const);
  // we also layout extra white keys to the left, so we can render
  // the black keys near them... except at the very beginning of the
  // piano (the Math.min part)
  let layoutExtraWhiteKeysLeft = Math.min(2, Math.round(offset));
  let layoutExtraWhiteKeysRight = 2;
  let notes = makeNoteRangeForLayout(
    offset - layoutExtraWhiteKeysLeft,
    numWhiteKeys + layoutExtraWhiteKeysLeft + layoutExtraWhiteKeysRight
  );
  let whiteKeySize = (canvasLongSize + 1) / numWhiteKeys;
  const startLP = ((offset % 1) + layoutExtraWhiteKeysLeft) * whiteKeySize;
  let realLP = (longPos: number, keySize: number) =>
    vertical ? canvasLongSize - longPos - keySize + startLP : longPos - startLP;
  let wkIndex = 0;
  return notes
    .map((fullNote) => {
      let { note, octave } = parseNote(fullNote);
      let black = note.endsWith("#");
      let n: KeyLayout;
      let longPos = wkIndex * whiteKeySize;
      if (black) {
        let keySize = Math.round(whiteKeySize * BLACK_KEY_SIZE);
        n = {
          note: noteStr({ note, octave }),
          [longPosProp]: Math.round(realLP(longPos - keySize / 2, keySize)),
          [shortPosProp]: 0,
          [longSizeProp]: keySize,
          [shortSizeProp]: Math.round(canvasShortSize / 2),
          black,
        } as unknown as KeyLayout;
      } else {
        let keySize = whiteKeySize;
        n = {
          note: noteStr({ note, octave }),
          [longPosProp]: realLP(longPos - 0.5, keySize),
          [shortPosProp]: -1,
          [longSizeProp]: keySize,
          [shortSizeProp]: canvasShortSize + 1,
          black,
        } as unknown as KeyLayout;
        ++wkIndex;
      }
      return n;
    })
    .sort((a, b) => (a.black ? -1 : b.black ? 1 : 0));
}

function hitTest(
  testX: number,
  testY: number,
  {
    canvas,
    vertical,
    offset,
    numWhiteKeys,
  }: {
    canvas: HTMLCanvasElement;
    vertical?: boolean;
    offset: number;
    numWhiteKeys: number;
  }
) {
  let layout = layoutKeys({ canvas, vertical, offset, numWhiteKeys });
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

function drawPiano({
  pointers,
  highlightNotes,
  canvas,
  vertical,
  offset,
  numWhiteKeys,
  annotations,
  colors,
}: {
  pointers: Record<number, string>;
  highlightNotes?: string[];
  canvas: HTMLCanvasElement;
  vertical?: boolean;
  offset: number;
  numWhiteKeys: number;
  annotations?: Record<string, KeyAnnotation>;
  colors: Record<PianoColorKey, string>;
}) {
  let layout = layoutKeys({ canvas, vertical, offset, numWhiteKeys }).reverse();
  let pressedNotes = new Set(Object.values(pointers));
  let ctx = canvas.getContext("2d")!;
  let width = canvas.width;
  let height = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = colors["key-border"];
  ctx.scale(RENDER_DENSITY, RENDER_DENSITY);
  ctx.lineWidth = 2;

  if (vertical) {
    ctx.translate(0, height);
    ctx.rotate((-90 * Math.PI) / 180);
  }

  for (let { x, y, w, h, black, note } of layout) {
    if (vertical) {
      [x, y, w, h] = [y, x, h, w];
      x = height - (x + w);
    }
    let annotation = annotations?.[note];
    ctx.beginPath();
    if (black) {
      ctx.roundRect(x - 0.5, y, w + 1, h + 0.5, [0, 0, 5, 5]);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
    ctx.fillStyle = black ? colors["key-black"] : colors["key-white"];
    ctx.fill();
    if (pressedNotes.has(note)) {
      ctx.fillStyle = black
        ? colors["key-black-pressed"]
        : colors["key-white-pressed"];
      ctx.fill();
    } else if (highlightNotes?.includes(note)) {
      ctx.fillStyle = black
        ? colors["key-black-highlight"]
        : colors["key-white-highlight"];
      ctx.fill();
    }
    ctx.stroke();
    if (annotation?.label) {
      ctx.fillStyle = black
        ? colors["key-black-label"]
        : colors["key-white-label"];
      ctx.font = `700 20px ${LABEL_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(annotation.label, x + w / 2, y + h - 16);
    }
  }

  ctx.restore();
}
