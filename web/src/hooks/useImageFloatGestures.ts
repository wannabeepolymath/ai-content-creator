import { useEffect, useRef, type MutableRefObject } from "react";
import type { Editor } from "@tiptap/react";
import { IMAGE_FLOAT_DRAG_H, IMAGE_FLOAT_DRAG_V } from "../constants";

export type ImageFloatGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  pos: number;
};

export function useImageFloatGestures(editor: Editor | null, imageFloatGestureRef: MutableRefObject<ImageFloatGesture | null>) {
  useEffect(() => {
    if (!editor) {
      return;
    }
    const ed = editor;
    const dom = ed.view.dom;
    function onPointerDownCapture(event: PointerEvent) {
      if ((event.target as HTMLElement).closest("[data-resize-handle]")) {
        imageFloatGestureRef.current = null;
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest("[data-resize-handle]")) {
        return;
      }
      const container = target.closest("[data-resize-container]");
      if (!container || !dom.contains(container)) {
        return;
      }
      let pos: number;
      try {
        pos = ed.view.posAtDOM(container as Node, 0);
      } catch {
        return;
      }
      if (pos < 0) {
        return;
      }
      const $pos = ed.state.doc.resolve(pos);
      const node = $pos.nodeAfter;
      if (!node || node.type.name !== "image") {
        return;
      }
      imageFloatGestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        pos,
      };
    }
    function onPointerUp(event: PointerEvent) {
      const g = imageFloatGestureRef.current;
      if (!g || g.pointerId !== event.pointerId) {
        return;
      }
      imageFloatGestureRef.current = null;
      const dx = event.clientX - g.startX;
      const dy = event.clientY - g.startY;
      const horizontal = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= IMAGE_FLOAT_DRAG_H;
      const verticalClear = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= IMAGE_FLOAT_DRAG_V && Math.abs(dx) <= 20;
      if (horizontal) {
        ed.chain().focus().setNodeSelection(g.pos).updateAttributes("image", { float: dx > 0 ? "right" : "left" }).run();
      } else if (verticalClear) {
        ed.chain().focus().setNodeSelection(g.pos).updateAttributes("image", { float: null }).run();
      }
    }
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    dom.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      dom.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [editor]);
}
