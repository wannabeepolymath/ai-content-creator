import { useEffect, type RefObject } from "react";

export function useLinkPopoverFocus(linkPopoverOpen: boolean, linkInputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (!linkPopoverOpen) {
      return;
    }
    const id = requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [linkPopoverOpen, linkInputRef]);
}
