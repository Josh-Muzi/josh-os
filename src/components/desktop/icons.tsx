/**
 * JoshOS pixel icon set — hand-drawn 16x16 SVGs, no icon library.
 * Consistency rules: one grid, shared palette below, ink outlines,
 * highlights top-left, shadows bottom-right, garden green accents
 * only where they earn their place.
 */

type Px = readonly [number, number, number, number, string];

const INK = "#3B3B36";
const PAPER = "#FFFFFF";
const PAPER_SHADE = "#D8D8CE";
const SILVER = "#C0C0C0";
const SILVER_SHADE = "#808080";
const GOLD = "#F6D372";
const GOLD_LIGHT = "#FFF3C9";
const GOLD_SHADE = "#C79F45";
const GREEN = "#2F9E44";
const GREEN_DARK = "#1B6B2E";
const NAVY = "#3B6EA5";
const BROWN = "#8B5A2B";
const BROWN_LIGHT = "#A9713A";
const BROWN_SHADE = "#5C3A1E";

export interface PixelIconProps {
  size?: number;
}

function PixelSvg({
  size = 32,
  rects,
}: {
  size?: number;
  rects: readonly Px[];
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="presentation"
      aria-hidden
      focusable="false"
    >
      {rects.map(([x, y, w, h, fill]) => (
        <rect
          key={`${x}-${y}-${w}-${h}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={fill}
        />
      ))}
    </svg>
  );
}

const NOTEPAD: readonly Px[] = [
  [7, 0, 1, 2, GREEN_DARK],
  [5, 0, 2, 1, GREEN],
  [8, 0, 2, 1, GREEN],
  [2, 2, 11, 13, INK],
  [3, 3, 9, 11, PAPER],
  [10, 3, 2, 2, PAPER_SHADE],
  [4, 6, 7, 1, GREEN],
  [4, 8, 7, 1, GREEN],
  [4, 10, 7, 1, GREEN],
  [4, 12, 4, 1, GREEN],
];

export function NotepadIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={NOTEPAD} />;
}

const FOLDER: readonly Px[] = [
  [1, 3, 7, 3, INK],
  [0, 5, 15, 9, INK],
  [2, 4, 5, 2, GOLD],
  [1, 6, 13, 7, GOLD],
  [1, 6, 13, 1, GOLD_LIGHT],
  [1, 12, 13, 1, GOLD_SHADE],
  [11, 1, 2, 2, GREEN],
  [10, 2, 1, 1, GREEN],
  [12, 3, 1, 2, GREEN_DARK],
];

export function FolderIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={FOLDER} />;
}

const BRIEFCASE: readonly Px[] = [
  [6, 1, 4, 1, INK],
  [5, 2, 1, 2, INK],
  [10, 2, 1, 2, INK],
  [1, 4, 14, 10, INK],
  [2, 5, 12, 8, BROWN],
  [2, 5, 12, 1, BROWN_LIGHT],
  [2, 8, 12, 1, BROWN_SHADE],
  [7, 7, 2, 2, GOLD],
  [11, 10, 2, 2, GREEN],
];

export function BriefcaseIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={BRIEFCASE} />;
}

const TOOLBOX: readonly Px[] = [
  [6, 2, 4, 1, INK],
  [5, 3, 1, 1, INK],
  [10, 3, 1, 1, INK],
  [1, 4, 14, 9, INK],
  [2, 5, 12, 7, SILVER],
  [2, 5, 12, 1, PAPER],
  [2, 8, 12, 1, SILVER_SHADE],
  [7, 6, 2, 2, GREEN],
];

export function ToolboxIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={TOOLBOX} />;
}

const RESUME: readonly Px[] = [
  [2, 1, 11, 14, INK],
  [3, 2, 9, 12, PAPER],
  [4, 4, 5, 2, NAVY],
  [4, 8, 7, 1, SILVER_SHADE],
  [4, 10, 7, 1, SILVER_SHADE],
  [4, 12, 5, 1, SILVER_SHADE],
  [9, 11, 2, 2, GREEN],
];

export function ResumeIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={RESUME} />;
}

const MAIL: readonly Px[] = [
  [1, 3, 14, 10, INK],
  [2, 4, 12, 8, PAPER],
  [2, 4, 1, 1, INK],
  [3, 5, 1, 1, INK],
  [4, 6, 1, 1, INK],
  [5, 7, 1, 1, INK],
  [6, 8, 1, 1, INK],
  [7, 8, 2, 1, INK],
  [13, 4, 1, 1, INK],
  [12, 5, 1, 1, INK],
  [11, 6, 1, 1, INK],
  [10, 7, 1, 1, INK],
  [9, 8, 1, 1, INK],
  [7, 9, 2, 2, GREEN],
];

export function MailIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={MAIL} />;
}

const SPROUT: readonly Px[] = [
  [7, 7, 2, 6, GREEN_DARK],
  [3, 4, 4, 3, GREEN],
  [5, 7, 2, 1, GREEN],
  [9, 4, 4, 3, GREEN],
  [9, 7, 2, 1, GREEN],
  [4, 13, 8, 1, SILVER_SHADE],
];

export function SproutIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={SPROUT} />;
}

const GLOBE: readonly Px[] = [
  [5, 3, 6, 1, NAVY],
  [4, 4, 8, 1, NAVY],
  [3, 5, 10, 6, NAVY],
  [4, 11, 8, 1, NAVY],
  [5, 12, 6, 1, NAVY],
  [5, 5, 3, 2, GREEN],
  [9, 7, 3, 2, GREEN],
  [6, 9, 2, 2, GREEN],
];

export function GlobeIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={GLOBE} />;
}

const COMPOST: readonly Px[] = [
  [6, 1, 2, 2, GREEN],
  [8, 2, 1, 1, GREEN_DARK],
  [2, 3, 12, 2, INK],
  [3, 3, 10, 1, SILVER],
  [3, 5, 10, 9, INK],
  [4, 6, 8, 7, SILVER],
  [6, 6, 1, 7, SILVER_SHADE],
  [9, 6, 1, 7, SILVER_SHADE],
  [7, 8, 2, 2, GREEN],
];

export function CompostBinIcon({ size }: PixelIconProps) {
  return <PixelSvg size={size} rects={COMPOST} />;
}
