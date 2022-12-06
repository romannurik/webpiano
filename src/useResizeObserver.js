import { useCallback, useLayoutEffect, useMemo } from 'react';

export function useResizeObserver(node, callback, deps) {
  let memoCallback = useCallback(callback, deps);

  useLayoutEffect(() => {
    if (!node) return;
    let resizeObserver = new ResizeObserver(entries => memoCallback());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [node, memoCallback]);
};