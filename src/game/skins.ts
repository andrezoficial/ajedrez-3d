export type SkinId = "gold_silver" | "copper_obsidian" | "ivory_ebony";

export type Skin = {
  id: SkinId;
  label: string;
  sunColor: string;
  sunAccent: string;
  sunEmissive: string;
  moonColor: string;
  moonAccent: string;
  moonEmissive: string;
  pieceDarkColor: string;
  pieceDarkAccent: string;
  pieceDarkEmissive: string;
  tileLight: string;
  tileDark: string;
  veinLight: string;
  veinDark: string;
  frame: string;
  felt: string;
};

export const SKINS: Record<SkinId, Skin> = {
  gold_silver: {
    id: "gold_silver",
    label: "Sol · Luna",
    sunColor: "#e6c37a",
    sunAccent: "#fff1c2",
    sunEmissive: "#7a4e12",
    moonColor: "#c5ccd8",
    moonAccent: "#eef3ff",
    moonEmissive: "#2a3348",
    pieceDarkColor: "#141414",
    pieceDarkAccent: "#2e2e2e",
    pieceDarkEmissive: "#050505",
    tileLight: "#d4c09a",
    tileDark: "#2c241e",
    veinLight: "#c4a574",
    veinDark: "#1a1412",
    frame: "#b8924e",
    felt: "#161310",
  },
  copper_obsidian: {
    id: "copper_obsidian",
    label: "Cobre",
    sunColor: "#c67a45",
    sunAccent: "#f0b27a",
    sunEmissive: "#6a2a10",
    moonColor: "#c9c4bc",
    moonAccent: "#ece8e0",
    moonEmissive: "#2a2622",
    pieceDarkColor: "#0c0c0e",
    pieceDarkAccent: "#242428",
    pieceDarkEmissive: "#020203",
    tileLight: "#e2c9a4",
    tileDark: "#1a1612",
    veinLight: "#b5651d",
    veinDark: "#3a322c",
    frame: "#c17a42",
    felt: "#120e0c",
  },
  ivory_ebony: {
    id: "ivory_ebony",
    label: "Marfil",
    sunColor: "#f0e6d2",
    sunAccent: "#fff8ea",
    sunEmissive: "#6a5434",
    moonColor: "#d8d4cc",
    moonAccent: "#f4f1ea",
    moonEmissive: "#1c1a18",
    pieceDarkColor: "#161412",
    pieceDarkAccent: "#2c2a28",
    pieceDarkEmissive: "#050504",
    tileLight: "#ecd9b0",
    tileDark: "#b58863",
    veinLight: "#d4b896",
    veinDark: "#6b4f35",
    frame: "#5c4634",
    felt: "#1c1612",
  },
};
