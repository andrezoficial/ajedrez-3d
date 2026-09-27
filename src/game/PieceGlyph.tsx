import { useId } from "react";
import type { PieceType, Side } from "./chess";
import type { Skin } from "./skins";

type Props = {
  type: PieceType;
  side: Side;
  skin: Skin;
  className?: string;
};

export function PieceGlyph({ type, side, skin, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const fillId = `fill-${uid}`;
  const isSun = side === "w";
  const light = isSun ? skin.sunAccent : "#4a4a50";
  const mid = isSun ? skin.sunColor : skin.pieceDarkColor;
  const dark = isSun ? "#7a5a22" : "#050506";
  const stroke = isSun ? "#5a3d14" : "#8a8a92";
  const eye = isSun ? "#3a280c" : "#d8d8de";

  return (
    <svg
      viewBox="0 0 45 45"
      className={className}
      aria-hidden
      style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.45))" }}
    >
      <defs>
        <linearGradient id={fillId} x1="18%" y1="0%" x2="86%" y2="100%">
          <stop offset="0%" stopColor={light} />
          <stop offset="42%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <g
        fill={`url(#${fillId})`}
        stroke={stroke}
        strokeWidth={1.15}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {type === "P" && <Pawn />}
        {type === "R" && <Rook />}
        {type === "N" && <Knight side={side} eye={eye} />}
        {type === "B" && <Bishop />}
        {type === "Q" && <Queen />}
        {type === "K" && <King />}
      </g>
    </svg>
  );
}

function Pedestal() {
  return (
    <>
      <path d="M9.5 38.2h26v2.6h-26z" />
      <path d="M11.2 35.4h22.6l2.2 2.8H9z" />
      <path d="M13.4 32.6h18.2c.9 0 1.6.6 1.8 1.4l.4 1.4H11.2l.4-1.4c.2-.8.9-1.4 1.8-1.4z" />
    </>
  );
}

function Pawn() {
  return (
    <>
      <Pedestal />
      <path d="M16.2 31.4c.8-3.4 2.6-5.4 6.3-5.4s5.5 2 6.3 5.4" />
      <path d="M18.4 24.6c0-2.2 1.7-3.6 4.1-3.6s4.1 1.4 4.1 3.6c0 1.4-.8 2.6-2 3.3h-4.2c-1.2-.7-2-1.9-2-3.3z" />
      <circle cx="22.5" cy="16.4" r="4.5" />
    </>
  );
}

function Rook() {
  return (
    <>
      <Pedestal />
      <path d="M14.2 31.6h16.6v-11.2H14.2z" />
      <path d="M13 20.4h19v2.4H13z" />
      <path d="M12.2 12.2h4.1v6.4h2.6V12.2h4.2v6.4h2.6V12.2h4.1v8.2H12.2z" />
    </>
  );
}

function Knight({ side, eye }: { side: Side; eye: string }) {
  const flip = side === "b" ? "translate(45 0) scale(-1 1)" : undefined;
  return (
    <g transform={flip}>
      <Pedestal />
      <path d="M13.8 32.6c.3-5.2 2.4-8.6 6.4-11.2 3.8-.2 8.6 2.4 10.8 8 1 2.2 1.2 3.2 1.2 3.2H13.8z" />
      <path d="M19.2 22.2c-2.6-3.4-2.8-7.4-.2-10.6 1.8-1.4 4.4-1.6 6.4-.2 2.2 1.4 2.8 3.8 1.6 6.2-1.6 1.6-4.2 2.8-7.8 4.6z" />
      <path d="M15.4 13.4c-2-1.6-2.4-4.4-.4-6.6 1.4-1.6 3.8-2.2 5.8-1.2 1.2-2 4-2.4 5.8-.4 1.6.4 2.6 2.2 2.2 4-0.2 1.6-1.4 2.8-3 3.2l-8.4 1.4c-1 .2-1.8-.2-2-.4z" />
      <path d="M24.6 3.4l2.6 5.8-4.6.4z" />
      <circle cx="20.4" cy="10.4" r="1.2" fill={eye} stroke="none" />
      <path d="M15.8 12.6c1.6.2 2.6 1 2.8 1.8" fill="none" strokeWidth={1} opacity="0.55" />
    </g>
  );
}

function Bishop() {
  return (
    <>
      <Pedestal />
      <path d="M16.6 31.6c1-4.6 2.8-7.2 5.9-7.2s4.9 2.6 5.9 7.2" />
      <path d="M22.5 8.4c-4.6 5.2-7.2 9.8-7.2 14.4 0 3.6 3.2 5.6 7.2 5.6s7.2-2 7.2-5.6c0-4.6-2.6-9.2-7.2-14.4z" />
      <circle cx="22.5" cy="7.2" r="2.15" />
      <path d="M21.3 14.2h2.4v9.2h-2.4z" fill="#1a1208" stroke="none" opacity="0.55" />
    </>
  );
}

function Queen() {
  return (
    <>
      <Pedestal />
      <path d="M15.6 31.6c1.2-4.8 3.2-7.4 6.9-7.4s5.7 2.6 6.9 7.4" />
      <path d="M12.8 16.2l2.6 8.6h14.2l2.6-8.6-4.6 3.4-3.1-6.6-3 6.6-3.1-6.6-3.1 6.6z" />
      <circle cx="12.6" cy="14.6" r="2" />
      <circle cx="18.4" cy="11.4" r="2" />
      <circle cx="22.5" cy="9.6" r="2.15" />
      <circle cx="26.6" cy="11.4" r="2" />
      <circle cx="32.4" cy="14.6" r="2" />
    </>
  );
}

function King() {
  return (
    <>
      <Pedestal />
      <path d="M15.6 31.6c1.2-4.8 3.2-7.4 6.9-7.4s5.7 2.6 6.9 7.4" />
      <path d="M14.4 18.6h16.2c.6 2.4.8 4.8.6 6.4H13.8c-.2-1.6 0-4 .6-6.4z" />
      <path d="M16.2 15.8h12.6v3.2H16.2z" />
      <path d="M21.2 6.2h2.6v10.2h-2.6z" />
      <path d="M17.6 9.2h9.8v2.5H17.6z" />
    </>
  );
}
