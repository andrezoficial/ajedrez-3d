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

/** Shared Staunton plinth — wide foot, two collars */
const BASE: [number, number][] = [
  [0.0, 0.0],
  [0.32, 0.0],
  [0.32, 0.03],
  [0.29, 0.044],
  [0.22, 0.058],
  [0.205, 0.085],
  [0.25, 0.105],
  [0.21, 0.122],
  [0.175, 0.14],
  [0.2, 0.158],
  [0.183, 0.168],
  [0.196, 0.172],
  [0.17, 0.175],
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

function knightHead() {
  const outline: [number, number][] = [
    [0.0, 0.0],
    [0.08, 0.06],
    [0.12, 0.18],
    [0.1, 0.34],
    [0.18, 0.44],
    [0.34, 0.42],
    [0.48, 0.46],
    [0.56, 0.54],
    [0.54, 0.64],
    [0.44, 0.7],
    [0.28, 0.72],
    [0.22, 0.82],
    [0.26, 1.02],
    [0.18, 1.14],
    [0.06, 1.06],
    [0.1, 0.88],
    [0.02, 0.72],
    [-0.1, 0.6],
    [-0.16, 0.42],
    [-0.12, 0.2],
    [-0.04, 0.06],
    [0.0, 0.0],
  ];
  const curve = new THREE.SplineCurve(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const sampled = curve.getSpacedPoints(120);
  const shape = new THREE.Shape();
  shape.moveTo(sampled[0].x, sampled[0].y);
  for (let i = 1; i < sampled.length; i++) shape.lineTo(sampled[i].x, sampled[i].y);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 7,
    curveSegments: 16,
  });
  g.translate(-0.1, 0, -0.13);
  g.computeVertexNormals();
  return g;
}

const geos = {
  pawnBody: pawnBody(),
  pawnHead: mark(new THREE.SphereGeometry(0.16, 40, 28), 0.64),
  pawnCollar: mark(new THREE.TorusGeometry(0.165, 0.018, 14, 40), 0.165),
  rookBody: rookBody(),
  rookCollar: mark(new THREE.TorusGeometry(0.168, 0.018, 14, 40), 0.165),
  rookWell: mark(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32), 0.735),
  bishopBody: bishopBody(),
  bishopCollar: mark(new THREE.TorusGeometry(0.162, 0.018, 14, 40), 0.165),
  bishopFinial: mark(new THREE.SphereGeometry(0.05, 22, 16), 1.24),
  bishopSlot: mark(new THREE.BoxGeometry(0.04, 0.28, 0.24), 1.02),
  queenBody: queenBody(),
  queenCollar: mark(new THREE.TorusGeometry(0.166, 0.018, 14, 40), 0.165),
  queenPearl: mark(new THREE.SphereGeometry(0.058, 22, 16), 1.24),
  kingBody: kingBody(),
  kingCollar: mark(new THREE.TorusGeometry(0.17, 0.018, 14, 40), 0.165),
  kingStem: mark(new THREE.BoxGeometry(0.055, 0.26, 0.055), 1.46),
  kingBar: mark(new THREE.BoxGeometry(0.18, 0.055, 0.055), 1.5),
  knightBase: knightBase(),
  knightCollar: mark(new THREE.TorusGeometry(0.165, 0.018, 14, 40), 0.175),
  knightHead: knightHead(),
  knightEarL: (() => {
    const g = new THREE.ConeGeometry(0.055, 0.18, 12);
    g.rotateZ(0.4);
    g.translate(0.04, 1.1, 0.07);
    return g;
  })(),
  knightEarR: (() => {
    const g = new THREE.ConeGeometry(0.055, 0.18, 12);
    g.rotateZ(-0.15);
    g.translate(0.08, 1.08, -0.07);
    return g;
  })(),
  knightEye: new THREE.SphereGeometry(0.028, 16, 10),
  rookMerlon: new THREE.BoxGeometry(0.1, 0.2, 0.13),
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
  const color = isSun ? skin.sunColor : skin.moonColor;
  const accent = isSun ? skin.sunAccent : skin.moonAccent;
  const emissive = isSun ? skin.sunEmissive : skin.moonEmissive;
  const body = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.68,
    roughness: 0.36,
    clearcoat: 0.32,
    clearcoatRoughness: 0.28,
    emissive,
    emissiveIntensity: 0.04,
    envMapIntensity: 0.65,
  });
  const acc = new THREE.MeshPhysicalMaterial({
    color: accent,
    metalness: 0.78,
    roughness: 0.24,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    emissive,
    emissiveIntensity: 0.08,
    envMapIntensity: 0.8,
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
    headGroup.add(mesh(geos.knightHead, mats.body));
    headGroup.add(mesh(geos.knightEarL, mats.body));
    headGroup.add(mesh(geos.knightEarR, mats.body));
    const eye = mesh(geos.knightEye, mats.accent);
    eye.position.set(0.32, 0.68, 0.12);
    headGroup.add(eye);
    headGroup.position.set(0, 0.36, 0);
    headGroup.rotation.y = Math.PI / 2;
    g.add(headGroup);
  }

  g.rotation.y = side === "w" ? Math.PI : 0;
  g.scale.setScalar(1.18);
  return g;
}

export function squareToPosition(index: number, y = 0.09) {
  return new THREE.Vector3((index % 8) - 3.5, y, Math.floor(index / 8) - 3.5);
}
