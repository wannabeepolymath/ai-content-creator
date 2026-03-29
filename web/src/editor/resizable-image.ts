import Image, { type ImageOptions } from "@tiptap/extension-image";
import { MIN_IMAGE_WIDTH } from "../constants";

export const ResizableImage = Image.extend({
  draggable: false,

  addOptions(): ImageOptions {
    const parent = this.parent?.();
    return {
      inline: parent?.inline ?? false,
      allowBase64: parent?.allowBase64 ?? false,
      HTMLAttributes: parent?.HTMLAttributes ?? {},
      resize: {
        enabled: true,
        minWidth: MIN_IMAGE_WIDTH,
        minHeight: 8,
        alwaysPreserveAspectRatio: true,
      },
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const widthAttr = element.getAttribute("width") ?? element.style.width;
          if (!widthAttr) {
            return null;
          }
          const parsed = Number.parseInt(widthAttr, 10);
          return Number.isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes) => {
          const styles: string[] = [];
          if (attributes.width) {
            styles.push(`width: ${attributes.width}px`);
          }
          return styles.length ? { style: `${styles.join("; ")};` } : {};
        },
      },
      float: {
        default: null,
        parseHTML: (element) => {
          const floatValue = element.style.cssFloat || element.style.float;
          return floatValue || null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  addNodeView() {
    const parent = this.parent?.();
    if (typeof parent !== "function") {
      return null;
    }
    return (props) => {
      const nodeView = parent(props);
      const dom = nodeView.dom as HTMLElement;
      const img = dom.querySelector("img");
      if (!img) {
        return nodeView;
      }

      const applyFloatLayout = (node: (typeof props)["node"]) => {
        const f = node.attrs.float as string | null | undefined;
        if (f === "left" || f === "right") {
          dom.style.float = f;
          dom.style.display = "block";
          dom.style.width = "max-content";
          dom.style.maxWidth = "100%";
          img.style.float = "none";
        } else {
          dom.style.float = "";
          dom.style.display = "flex";
          dom.style.width = "";
          dom.style.maxWidth = "100%";
          img.style.float = "";
        }
      };

      applyFloatLayout(props.node);

      const origUpdate = nodeView.update;
      if (origUpdate) {
        nodeView.update = (node, decorations, innerDecorations) => {
          const ok = origUpdate.call(nodeView, node, decorations, innerDecorations);
          if (ok) {
            applyFloatLayout(node);
          }
          return ok;
        };
      }

      return nodeView;
    };
  },
});
