import type { SVGProps } from "react";

const base = {
  className: "toolbar-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconUndo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

export function IconRedo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

export function IconParagraph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H17" />
    </svg>
  );
}

type HeadingLevelProps = SVGProps<SVGSVGElement> & { level: 1 | 2 | 3 | 4 };

export function IconHeading({ level, ...props }: HeadingLevelProps) {
  const label = `H${level}`;
  return (
    <svg {...base} {...props}>
      <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" stroke="none">
        {label}
      </text>
    </svg>
  );
}

/** Small chevron for toolbar dropdown triggers (e.g. headings). */
export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Bootstrap Icons `bi-quote` (MIT) — opening pair only. */
const BI_QUOTE =
  "M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388q0-.527.062-1.054.093-.558.31-.992t.559-.683q.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 9 7.558V11a1 1 0 0 0 1 1zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612q0-.527.062-1.054.094-.558.31-.992.217-.434.559-.683.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 3 7.558V11a1 1 0 0 0 1 1z";

export function IconBlockquote(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d={BI_QUOTE} />
    </svg>
  );
}

export function IconListBulleted(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

export function IconListNumbered(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M4 6h1" />
      <path d="M4 12h1" />
      <path d="M4 18h1" />
    </svg>
  );
}

export function IconListTask(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="5" height="5" rx="1" />
      <path d="M10 7.5h11" />
      <rect x="3" y="11" width="5" height="5" rx="1" />
      <path d="M10 13.5h11" />
      <rect x="3" y="17" width="5" height="5" rx="1" />
      <path d="M10 19.5h11" />
    </svg>
  );
}

export function IconBold(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

export function IconItalic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M19 4h-9" />
      <path d="M14 20H5" />
      <path d="M15 4 9 20" />
    </svg>
  );
}

export function IconUnderline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function IconStrikethrough(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function IconCodeInline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}

/** Bootstrap Icons `bi-highlighter` (MIT). */
export function IconHighlight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path
        fillRule="evenodd"
        d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.854l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8.995-8.07zm-.115 1.47L2.727 9.52l3.753 3.753 7.406-8.254zm3.585 2.17.064-.068a1 1 0 0 0-.017-1.396L13.18 1.387a1 1 0 0 0-1.396-.018l-.068.065zM5.293 13.5 2.5 10.707v1.586L3.707 13.5z"
      />
    </svg>
  );
}

/** Prohibited / none — remove highlight (toolbar dropdown). */
export function IconHighlightNone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 7.5l9 9" />
    </svg>
  );
}

export function IconSuperscript(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <text x="8" y="16" fontSize="12" fontWeight="600" fill="currentColor" stroke="none">
        x
      </text>
      <text x="14" y="10" fontSize="9" fontWeight="600" fill="currentColor" stroke="none">
        2
      </text>
    </svg>
  );
}

export function IconSubscript(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <text x="8" y="16" fontSize="12" fontWeight="600" fill="currentColor" stroke="none">
        x
      </text>
      <text x="14" y="20" fontSize="9" fontWeight="600" fill="currentColor" stroke="none">
        2
      </text>
    </svg>
  );
}

export function IconAlignLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M17 10H3" />
      <path d="M21 6H3" />
      <path d="M21 14H3" />
      <path d="M21 18H3" />
    </svg>
  );
}

export function IconAlignCenter(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M18 10H6" />
      <path d="M21 6H3" />
      <path d="M21 14H3" />
      <path d="M18 18H6" />
    </svg>
  );
}

export function IconAlignRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21 10H7" />
      <path d="M21 6H3" />
      <path d="M21 14H3" />
      <path d="M21 18H3" />
    </svg>
  );
}

export function IconAlignJustify(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21 10H3" />
      <path d="M21 6H3" />
      <path d="M21 14H3" />
      <path d="M21 18H3" />
    </svg>
  );
}

export function IconLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** Apply / commit link (enter). */
export function IconLinkApply(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h7a4 4 0 0 1 4 4v7" />
    </svg>
  );
}

export function IconUnlink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.71 1.71" />
      <path d="M12 17l-1.72 1.71a5 5 0 0 1-7.07-7.07l1.71-1.71" />
      <path d="M14 10 4 20" />
    </svg>
  );
}

export function IconExternalLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

export function IconImageAdd(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
      <path d="M19 5v4" />
      <path d="M17 7h4" />
    </svg>
  );
}

/** Bootstrap Icons `bi-code-square` (MIT). */
export function IconCodeBlock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
      <path d="M6.854 4.646a.5.5 0 0 1 0 .708L4.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0m2.292 0a.5.5 0 0 0 0 .708L11.793 8l-2.647 2.646a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708 0" />
    </svg>
  );
}

export function IconHorizontalRule(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M8 8v8" />
      <path d="M16 8v8" />
    </svg>
  );
}

export function IconLineBreak(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h12" />
      <path d="m16 8 4 4-4 4" />
      <path d="M4 6v4" />
    </svg>
  );
}

export function IconClearFormat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m7 21-4.3-4.3" />
      <path d="M19 3 3 19" />
      <path d="m12 7 4-4" />
      <path d="M5.7 5.7 3 3" />
    </svg>
  );
}

export function IconTable(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

export function IconRowPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function IconRowMinus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconColPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconColMinus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
    </svg>
  );
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export function IconZoomOut(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function IconZoomIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function IconImageFloatLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="10" height="10" rx="1" />
      <path d="M15 5h6" />
      <path d="M15 9h6" />
      <path d="M15 13h6" />
      <path d="M15 17h6" />
    </svg>
  );
}

export function IconImageFloatRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="11" y="4" width="10" height="10" rx="1" />
      <path d="M3 5h6" />
      <path d="M3 9h6" />
      <path d="M3 13h6" />
      <path d="M3 17h6" />
    </svg>
  );
}

export function IconImageNoFloat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
    </svg>
  );
}

export function IconImageReset(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
