import * as THREE from "three";
import type { PieceType, Side } from "./chess";
import type { Skin } from "./skins";

function lathe(pairs: [number, number][], segments = 80) {
  const g = new THREE.LatheGeometry(
    pairs.map(([x, y]) => new THREE.Vector2(Math.max(0, x), y)),
    segments,
  );
  g.computeVertexNormals();
  return g;
}

function mark(geo: THREE.BufferGeometry, y = 0) {
  geo.translate(0, y, 0);
  return geo;
}

/** Shared Staunton plinth — one clean chamfer + a gentle taper up to the
 * collar ring (added separately as a torus mesh per piece). Fewer direction
 * changes than before so the silhouette reads as crisp and deliberate
 * instead of a busy stack of tiny steps competing with the collar above it. */
const BASE: [number, number][] = [
  [0.0, 0.0],
  [0.33, 0.0],
  [0.33, 0.026],
  [0.27, 0.052],
  [0.215, 0.08],
  [0.185, 0.11],
  [0.174, 0.145],
  [0.178, 0.162],
  [0.165, 0.175],
];

function pawnBody() {
  return lathe([
    ...BASE,
    [0.13, 0.22],
    [0.11, 0.38],
    [0.13, 0.46],
    [0.1, 0.5],
    [0.0, 0.5],
  ]);
}

function rookBody() {
  return lathe([
    ...BASE,
    [0.175, 0.2],
    [0.165, 0.52],
    [0.23, 0.54],
    [0.24, 0.7],
    [0.18, 0.71],
    [0.0, 0.71],
  ]);
}

function bishopBody() {
  return lathe([
    ...BASE,
    [0.125, 0.22],
    [0.105, 0.48],
    [0.14, 0.58],
    [0.12, 0.64],
    [0.175, 0.76],
    [0.195, 0.92],
    [0.14, 1.06],
    [0.055, 1.16],
    [0.028, 1.2],
    [0.0, 1.21],
  ]);
}

function queenBody() {
  return lathe([
    ...BASE,
    [0.13, 0.22],
    [0.108, 0.52],
    [0.145, 0.64],
    [0.12, 0.74],
    [0.175, 0.86],
    [0.2, 1.02],
    [0.16, 1.1],
    [0.22, 1.14],
    [0.19, 1.18],
    [0.0, 1.18],
  ]);
}

function kingBody() {
  return lathe([
    ...BASE,
    [0.135, 0.22],
    [0.112, 0.56],
    [0.15, 0.68],
    [0.125, 0.8],
    [0.185, 0.94],
    [0.205, 1.12],
    [0.165, 1.22],
    [0.22, 1.26],
    [0.18, 1.3],
    [0.0, 1.3],
  ]);
}

function knightBase() {
  return lathe([
    ...BASE,
    [0.155, 0.22],
    [0.14, 0.32],
    [0.17, 0.38],
    [0.0, 0.38],
  ]);
}

/** The knight head+muzzle+jaw is ONE seamless lathe — the same technique
 * used for every other piece's body — instead of separate primitives glued
 * together. Gluing a sphere to a cone to another sphere always leaves
 * visible seams where they only touch tangentially (that's what made the
 * previous version look crooked/assembled-wrong). A lathe revolved around
 * the *forward* axis instead of the vertical one gives a single continuous
 * torpedo-like volume: wide through the jaw/cranium, tapering to a rounded
 * nose at the front and to a hidden point embedded inside the neck at the
 * back. "Forward" (the nose direction) is +X; ears/eyes split across
 * +Z/-Z. */
function knightHead() {
  const profile: [number, number][] = [
    [0.0, 0.0], // nose tip
    [0.05, 0.03],
    [0.082, 0.07],
    [0.11, 0.13],
    [0.134, 0.19],
    [0.154, 0.25], // jaw, widening
    [0.163, 0.3], // cranium, the widest point
    [0.143, 0.35],
    [0.088, 0.39],
    [0.0, 0.4], // tapers to a point, buried inside the neck
  ];
  const g = lathe(profile, 28);
  g.rotateZ(Math.PI / 2); // revolve axis Y -> X, so it points forward
  g.translate(0.48, 0.3, 0);
  return g;
}

function knightNeck() {
  const g = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 24, 1);
  g.translate(0, 0.15, 0); // base at the local origin, top at y=0.3
  g.rotateZ(-0.28); // lean the top forward, arching toward the head
  return g;
}

function knightMane() {
  // A thin fin along the crest of the neck — just enough to suggest a mane
  // without turning into visual clutter on a small piece.
  const g = new THREE.SphereGeometry(0.09, 16, 12);
  g.scale(0.25, 1.2, 0.4);
  g.rotateZ(-0.28);
  g.translate(0.0, 0.17, 0);
  return g;
}

function knightEar(mirror: 1 | -1) {
  const g = new THREE.ConeGeometry(0.05, 0.19, 14);
  g.rotateX(mirror * 0.38); // splay outward, away from the centerline
  g.translate(0.15, 0.44, mirror * 0.075);
  return g;
}

const geos = {
  pawnBody: pawnBody(),
  pawnHead: mark(new THREE.SphereGeometry(0.16, 40, 28), 0.64),
  pawnCollar: mark(new THREE.TorusGeometry(0.165, 0.018, 28, 48), 0.165),
  rookBody: rookBody(),
  rookCollar: mark(new THREE.TorusGeometry(0.168, 0.018, 28, 48), 0.165),
  rookWell: mark(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32), 0.735),
  bishopBody: bishopBody(),
  bishopCollar: mark(new THREE.TorusGeometry(0.162, 0.018, 28, 48), 0.165),
  bishopFinial: mark(new THREE.SphereGeometry(0.05, 24, 18), 1.24),
  bishopSlot: mark(new THREE.BoxGeometry(0.04, 0.28, 0.24), 1.02),
  queenBody: queenBody(),
  queenCollar: mark(new THREE.TorusGeometry(0.166, 0.018, 28, 48), 0.165),
  queenPearl: mark(new THREE.SphereGeometry(0.058, 24, 18), 1.24),
  kingBody: kingBody(),
  kingCollar: mark(new THREE.TorusGeometry(0.17, 0.018, 28, 48), 0.165),
  kingStem: mark(new THREE.BoxGeometry(0.055, 0.26, 0.055), 1.46),
  kingBar: mark(new THREE.BoxGeometry(0.18, 0.055, 0.055), 1.5),
  knightBase: knightBase(),
  knightCollar: mark(new THREE.TorusGeometry(0.165, 0.018, 28, 48), 0.175),
  knightNeck: knightNeck(),
  knightHead: knightHead(),
  knightMane: knightMane(),
  knightEarL: knightEar(1),
  knightEarR: knightEar(-1),
  knightEye: new THREE.SphereGeometry(0.02, 14, 10),
  // Slightly tapered prism (not a flat-sided cube) for a more finished,
  // deliberately-crafted crenellation instead of a plain blocky box.
  rookMerlon: (() => {
    const g = new THREE.CylinderGeometry(0.052, 0.06, 0.2, 4, 1);
    g.rotateY(Math.PI / 4);
    return g;
  })(),
};

const padGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.025, 32);
const padMat = new THREE.MeshStandardMaterial({
  color: "#140f0c",
  roughness: 0.92,
  metalness: 0.05,
});
const queenSpikeGeo = new THREE.ConeGeometry(0.038, 0.14, 9);

export type PieceMaterials = {
  body: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshPhysicalMaterial;
  slot: THREE.MeshPhysicalMaterial;
};

export function createMaterials(skin: Skin, side: Side): PieceMaterials {
  const isSun = side === "w";
  const color = isSun ? skin.sunColor : skin.pieceDarkColor;
  const accent = isSun ? skin.sunAccent : skin.pieceDarkAccent;
  const emissive = isSun ? skin.sunEmissive : skin.pieceDarkEmissive;
  const body = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.72,
    roughness: 0.3,
    clearcoat: 0.4,
    clearcoatRoughness: 0.22,
    emissive,
    emissiveIntensity: 0.04,
    envMapIntensity: 0.85,
  });
  const acc = new THREE.MeshPhysicalMaterial({
    color: accent,
    metalness: 0.8,
    roughness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.14,
    emissive,
    emissiveIntensity: 0.08,
    envMapIntensity: 1,
  });
  const slot = new THREE.MeshPhysicalMaterial({
    color: isSun ? "#5a3d14" : "#1a1e28",
    metalness: 0.35,
    roughness: 0.5,
    emissive,
    emissiveIntensity: 0.03,
  });
  return { body, accent: acc, slot };
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createPieceMesh(type: PieceType, side: Side, mats: PieceMaterials) {
  const g = new THREE.Group();
  g.userData.pieceType = type;
  g.userData.side = side;
  const pad = mesh(padGeo, padMat);
  pad.position.y = 0.012;
  pad.castShadow = false;
  g.add(pad);

  if (type === "P") {
    g.add(mesh(geos.pawnBody, mats.body));
    g.add(mesh(geos.pawnHead, mats.body));
    g.add(mesh(geos.pawnCollar, mats.accent));
  } else if (type === "R") {
    g.add(mesh(geos.rookBody, mats.body));
    g.add(mesh(geos.rookCollar, mats.accent));
    g.add(mesh(geos.rookWell, mats.slot));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const m = mesh(geos.rookMerlon, mats.body);
      m.position.set(Math.cos(a) * 0.185, 0.8, Math.sin(a) * 0.185);
      m.rotation.y = -a;
      g.add(m);
    }
  } else if (type === "B") {
    g.add(mesh(geos.bishopBody, mats.body));
    g.add(mesh(geos.bishopCollar, mats.accent));
    g.add(mesh(geos.bishopFinial, mats.accent));
    g.add(mesh(geos.bishopSlot, mats.slot));
  } else if (type === "Q") {
    g.add(mesh(geos.queenBody, mats.body));
    g.add(mesh(geos.queenCollar, mats.accent));
    g.add(mesh(geos.queenPearl, mats.accent));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = mesh(queenSpikeGeo, mats.accent);
      s.position.set(Math.cos(a) * 0.175, 1.24, Math.sin(a) * 0.175);
      g.add(s);
    }
  } else if (type === "K") {
    g.add(mesh(geos.kingBody, mats.body));
    g.add(mesh(geos.kingCollar, mats.accent));
    g.add(mesh(geos.kingStem, mats.accent));
    g.add(mesh(geos.kingBar, mats.accent));
  } else {
    g.add(mesh(geos.knightBase, mats.body));
    g.add(mesh(geos.knightCollar, mats.accent));
    const headGroup = new THREE.Group();
    headGroup.add(mesh(geos.knightNeck, mats.body));
    headGroup.add(mesh(geos.knightHead, mats.body));
    headGroup.add(mesh(geos.knightMane, mats.accent));
    headGroup.add(mesh(geos.knightEarL, mats.body));
    headGroup.add(mesh(geos.knightEarR, mats.body));
    const eyeL = mesh(geos.knightEye, mats.accent);
    eyeL.position.set(0.24, 0.36, 0.12);
    headGroup.add(eyeL);
    const eyeR = mesh(geos.knightEye, mats.accent);
    eyeR.position.set(0.24, 0.36, -0.12);
    headGroup.add(eyeR);
    headGroup.position.set(0, 0.35, 0);
    g.add(headGroup);
  }

  g.rotation.y = side === "w" ? Math.PI : 0;
  g.scale.setScalar(1.18);
  return g;
}

export function squareToPosition(index: number, y = 0.09) {
  return new THREE.Vector3((index % 8) - 3.5, y, Math.floor(index / 8) - 3.5);
}
