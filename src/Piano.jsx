import cn from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { makeNoteRangeForLayout, parseNote } from "./piano-util";
import styles from "./Piano.module.scss";
import { useResizeObserver } from "./useResizeObserver";
import { LoadingSpinner } from "./LoadingSpinner";

const BLACK_KEY_SIZE = 0.7;

const RENDER_DENSITY = 2;

const IDEAL_KEY_SIZE_PX = {
  normal: 44,
  large: 64,
  huge: 80,
};

const PIANO_COLORS = {
  "key-white": "#fff",
  "key-white-pressed": "#ccc",
  "key-black": "#000",
  "key-black-pressed": "#333",
  "key-border": "#000",
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
  onNoteDown,
  onNoteUp,
  onModifyNotes,
}) {
  offset = Math.max(0, Math.min(108, offset));

  // drawing and layout
  let [canvas, setCanvas] = useState();
  let [numWhiteKeys, setNumWhiteKeys] = useState(10);
  let [colors, setColors] = useState({});

  // elements
  let [container, setContainer] = useState(null);

  // track active notes + pointers
  let pointers = useRef({});

  // Get colors
  useEffect(() => {
    setTimeout(() => {
      let cs = window.getComputedStyle(document.body);
      setColors(
        Object.fromEntries(
          Object.keys(PIANO_COLORS).map((id) => [
            id,
            cs.getPropertyValue(`--color-${id}`),
          ])
        )
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
      downNotes: highlightNotes || [],
      canvas,
      vertical,
      offset,
      numWhiteKeys,
      colors,
    });
  }, [canvas, colors, vertical, offset, numWhiteKeys, highlightNotes]);

  useResizeObserver(
    container,
    () => {
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
    (x, y) => hitTest(x, y, { canvas, vertical, offset, numWhiteKeys }),
    [canvas, vertical, offset, numWhiteKeys]
  );

  useEffect(() => {
    let cancel = (ev) => {
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
    let move = (ev) => {
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

  if (loading) {
    return <div className={cn(className, styles.loading)}>
      <LoadingSpinner />
    </div>;
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

function layoutKeys({ canvas, vertical, offset, numWhiteKeys }) {
  let width = canvas.width;
  let height = canvas.height;
  let canvasLongSize = !vertical ? width : height;
  let canvasShortSize = !vertical ? height : width;
  let longPosProp = !vertical ? "x" : "y";
  let shortPosProp = !vertical ? "y" : "x";
  let longSizeProp = !vertical ? "w" : "h";
  let shortSizeProp = !vertical ? "h" : "w";
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
  let realLP = (longPos, keySize) =>
    vertical ? canvasLongSize - longPos - keySize + startLP : longPos - startLP;
  let wkIndex = 0;
  return notes
    .map((fullNote) => {
      let { note, octave } = parseNote(fullNote);
      let black = note.endsWith("#");
      let n;
      let longPos = wkIndex * whiteKeySize;
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
        let keySize = whiteKeySize;
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

function hitTest(testX, testY, { canvas, vertical, offset, numWhiteKeys }) {
  let layout = layoutKeys({ canvas, vertical, offset, numWhiteKeys });
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

function drawPiano({
  pointers,
  downNotes,
  canvas,
  vertical,
  offset,
  numWhiteKeys,
  colors,
}) {
  let layout = layoutKeys({ canvas, vertical, offset, numWhiteKeys }).reverse();
  let pressedNotes = new Set(Object.values(pointers));
  let ctx = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = colors["key-border"];
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
    if (pressedNotes.has(note) || downNotes.includes(note)) {
      ctx.fillStyle = black
        ? colors["key-black-pressed"]
        : colors["key-white-pressed"];
      ctx.fill();
    } else {
      ctx.fillStyle = black ? colors["key-black"] : colors["key-white"];
      ctx.fill();
    }
    ctx.stroke();
  }

  ctx.restore();
}
