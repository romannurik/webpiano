import { useState, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

export function useMediaQuery(query) {
  let [isActive, setActive] = useState(false);

  useLayoutEffect(() => {
    let mql = window.matchMedia(query);
    let onChange = e => {
      setActive(!!e.matches);
      flushSync(); // why are these necessary as of React 18?
    };
    setActive(!!mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query, setActive]);

  return isActive;
}