export type SkinId = "gold_silver" | "copper_obsidian";

export type Skin = {
  id: SkinId;
  label: string;
  sunColor: string;
  sunAccent: string;
  sunEmissive: string;
  moonColor: string;
  moonAccent: string;
  moonEmissive: string;
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
    label: "Sol dorado · Luna plateada",
    sunColor: "#e6c37a",
    sunAccent: "#fff1c2",
    sunEmissive: "#7a4e12",
    moonColor: "#c5ccd8",
    moonAccent: "#eef3ff",
    moonEmissive: "#2a3348",
    tileLight: "#c4ae86",
    tileDark: "#2a211c",
    veinLight: "#c4a574",
    veinDark: "#1a1412",
    frame: "#c9a45b",
    felt: "#1a1612",
  },
  copper_obsidian: {
    id: "copper_obsidian",
    label: "Cobre · Obsidiana",
    sunColor: "#c67a45",
    sunAccent: "#f0b27a",
    sunEmissive: "#6a2a10",
    moonColor: "#3a3544",
    moonAccent: "#b9a6e0",
    moonEmissive: "#2a1638",
    tileLight: "#e2c9a4",
    tileDark: "#141018",
    veinLight: "#b5651d",
    veinDark: "#6b4aa0",
    frame: "#d08a4a",
    felt: "#100c14",
  },
};
