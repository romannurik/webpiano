import { useCallback, useLayoutEffect, type DependencyList } from "react";

export function useResizeObserver(
  node: HTMLElement | undefined,
  callback: () => void,
  deps: DependencyList
) {
  let memoCallback = useCallback(callback, deps);

  useLayoutEffect(() => {
    if (!node) return;
    let resizeObserver = new ResizeObserver(() => memoCallback());
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [node, memoCallback]);
}
