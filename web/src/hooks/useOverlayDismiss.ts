import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * When `open` is true, dismisses on pointerdown outside `containerRef`, and optionally on Escape.
 */
export function useOverlayDismiss(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  escapeKey = false,
) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = containerRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      onDismissRef.current();
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (escapeKey && event.key === "Escape") {
        onDismissRef.current();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    if (escapeKey) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      if (escapeKey) {
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [open, containerRef, escapeKey]);
}
