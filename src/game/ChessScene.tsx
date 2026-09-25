import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { fileOf, rankOf, squareIndex, type PieceCode, type PieceType, type Side } from "./chess";
import { createMaterials, createPieceMesh, squareToPosition } from "./pieces";
import { SKINS, type Skin, type SkinId } from "./skins";
import { useGame } from "./store";

const pointerGuard = { downX: 0, downY: 0, moved: false };
useGLTF.preload("/models/rey-sol.glb");

/** True if the pointer barely moved since pointerdown (click, not drag). */
function isTap(clientX?: number, clientY?: number) {
  if (pointerGuard.moved) return false;
  if (clientX == null || clientY == null) return !pointerGuard.moved;
  const dx = clientX - pointerGuard.downX;
  const dy = clientY - pointerGuard.downY;
  // 12px threshold — tolerates tiny jitter from trackpads / touch
  return dx * dx + dy * dy < 144;
}

function markPointerDown(clientX: number, clientY: number) {
  pointerGuard.downX = clientX;
  pointerGuard.downY = clientY;
  pointerGuard.moved = false;
}

function markPointerMove(clientX: number, clientY: number) {
  const dx = clientX - pointerGuard.downX;
  const dy = clientY - pointerGuard.downY;
  if (dx * dx + dy * dy >= 144) pointerGuard.moved = true;
}

function noRaycast() {}

function makeStoneTexture(base: string, vein: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = base;
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 10; i++) {
    x.strokeStyle = vein;
    x.globalAlpha = 0.14 + Math.random() * 0.28;
    x.lineWidth = 0.5 + Math.random() * 1.6;
    x.beginPath();
    let a = Math.random() * 128;
    let b = Math.random() * 128;
    x.moveTo(a, b);
    for (let j = 0; j < 5; j++) {
      a += (Math.random() - 0.5) * 70;
      b += (Math.random() - 0.5) * 70;
      x.lineTo(a, b);
    }
    x.stroke();
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGoldTexture(tint: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#5a3d14");
  grad.addColorStop(0.42, tint);
  grad.addColorStop(0.55, "#fff6da");
  grad.addColorStop(1, "#5a3d14");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "#000" : "#fff";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const env = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    envScene.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Soft volumetric light shaft (cone of light in the air) */
function LightShaft({
  position,
  color,
  intensity = 0.45,
  length = 9,
  radius = 1.8,
  angle = 0.35,
}: {
  position: [number, number, number];
  color: string;
  intensity?: number;
  length?: number;
  radius?: number;
  angle?: number;
}) {
  const mat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: intensity * 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, [color, intensity]);

  return (
    <group position={position}>
      {/* Main volumetric cone */}
      <mesh rotation={[Math.PI / 2 + angle, 0, 0]} position={[0, -length * 0.35, 0]} raycast={noRaycast}>
        <cylinderGeometry args={[radius * 0.15, radius, length, 24, 1, true]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Soft outer glow layer */}
      <mesh rotation={[Math.PI / 2 + angle, 0, 0]} position={[0, -length * 0.3, 0]} raycast={noRaycast}>
        <cylinderGeometry args={[radius * 0.4, radius * 1.6, length * 0.85, 20, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function VolumetricHaze({ skin, warm }: { skin: Skin; warm: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Concentrate haze near the board and rising upward
      const r = 1.5 + Math.random() * 7;
      const t = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(t) * r * (0.6 + Math.random() * 0.8);
      positions[i * 3 + 1] = 0.4 + Math.random() * 5.5;
      positions[i * 3 + 2] = Math.sin(t) * r * (0.6 + Math.random() * 0.8);
      sizes[i] = 0.04 + Math.random() * 0.12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
  });

  return (
    <points ref={ref} geometry={geo} raycast={noRaycast}>
      <pointsMaterial
        color={warm ? skin.sunAccent : skin.moonAccent}
        size={0.09}
        transparent
        opacity={0.25}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Lighting({ skin, turn, phase }: { skin: Skin; turn: Side; phase: "sun" | "moon" | null }) {
  const warm = phase === "sun" || (!phase && turn === "w");
  const keyColor = warm ? "#ffe4b8" : "#c8d4ff";
  const fillColor = warm ? skin.sunAccent : skin.moonAccent;
  const rimColor = warm ? "#ffb347" : "#7a9cff";

  return (
    <>
      {/* Soft ambient base — keeps shadows from going pure black */}
      <ambientLight intensity={warm ? 0.22 : 0.18} color={warm ? "#1a1208" : "#080a14"} />

      {/* Key directional — main sun/moon light with strong shadows */}
      <directionalLight
        color={keyColor}
        intensity={warm ? 2.15 : 1.55}
        position={warm ? [9, 16, 7] : [-7, 14, -5]}
        castShadow
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.00025}
      />

      {/* Cool fill from opposite side */}
      <directionalLight
        color={warm ? "#a8c0e8" : "#e8d4b8"}
        intensity={0.38}
        position={warm ? [-8, 9, -4] : [6, 8, 5]}
      />

      {/* Rim / back light for separation */}
      <directionalLight color={rimColor} intensity={0.55} position={[0, 4, -12]} />

      {/* Volumetric point lights near the board */}
      <pointLight
        color={fillColor}
        intensity={warm ? 1.4 : 1.8}
        position={warm ? [4.5, 5.5, 3] : [-4.5, 5.5, -3]}
        distance={22}
        decay={1.6}
      />
      <pointLight
        color={warm ? skin.sunEmissive : skin.moonEmissive}
        intensity={0.85}
        position={[0, 2.8, 0]}
        distance={14}
        decay={1.8}
      />
      <pointLight color="#ffffff" intensity={0.35} position={[0, 6, 8]} distance={18} decay={2} />

      {/* Soft under-board bounce */}
      <pointLight
        color={warm ? "#3a2810" : "#101828"}
        intensity={0.55}
        position={[0, -1.8, 0]}
        distance={12}
        decay={2}
      />

      {/* Volumetric light shafts */}
      <LightShaft
        position={warm ? [6.5, 11, 5] : [-5.5, 10, -4]}
        color={keyColor}
        intensity={warm ? 0.7 : 0.55}
        length={14}
        radius={2.4}
        angle={0.28}
      />
      <LightShaft
        position={warm ? [-3, 9, 7] : [4, 8.5, -6]}
        color={fillColor}
        intensity={0.35}
        length={11}
        radius={1.6}
        angle={0.4}
      />

      {/* Atmospheric haze particles */}
      <VolumetricHaze skin={skin} warm={warm} />
    </>
  );
}

function roundedSquare(half: number, corner: number) {
  const s = new THREE.Shape();
  s.moveTo(-half + corner, -half);
  s.lineTo(half - corner, -half);
  s.quadraticCurveTo(half, -half, half, -half + corner);
  s.lineTo(half, half - corner);
  s.quadraticCurveTo(half, half, half - corner, half);
  s.lineTo(-half + corner, half);
  s.quadraticCurveTo(-half, half, -half, half - corner);
  s.lineTo(-half, -half + corner);
  s.quadraticCurveTo(-half, -half, -half + corner, -half);
  return s;
}

function Label({
  text,
  color,
  position,
}: {
  text: string;
  color: string;
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, 64, 64);
    x.fillStyle = color;
    x.font = "600 34px 'Times New Roman', serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, 32, 34);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, color]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <planeGeometry args={[0.32, 0.32]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function Board({ skin }: { skin: Skin }) {
  const lightMap = useMemo(() => makeStoneTexture(skin.tileLight, skin.veinLight), [skin]);
  const darkMap = useMemo(() => makeStoneTexture(skin.tileDark, skin.veinDark), [skin]);
  const goldMap = useMemo(() => makeGoldTexture(skin.frame), [skin]);
  const frameShape = useMemo(() => {
    const outer = roundedSquare(5.25, 0.55);
    outer.holes.push(roundedSquare(4.18, 0.12));
    return outer;
  }, []);
  const selectSquare = useGame((s) => s.selectSquare);
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <group>
      {Array.from({ length: 64 }, (_, i) => {
        const file = i % 8;
        const rank = Math.floor(i / 8);
        const isLight = (file + rank) % 2 === 0;
        return (
          <mesh
            key={i}
            position={[file - 3.5, 0, rank - 3.5]}
            receiveShadow
            onPointerDown={(e) => {
              e.stopPropagation();
              markPointerDown(e.clientX, e.clientY);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isTap(e.clientX, e.clientY)) return;
              selectSquare(i);
            }}
          >
            <boxGeometry args={[0.98, 0.14, 0.98]} />
            <meshStandardMaterial map={isLight ? lightMap : darkMap} roughness={0.62} metalness={0.12} />
          </mesh>
        );
      })}

      <mesh position={[0, -0.135, 0]} receiveShadow raycast={noRaycast}>
        <boxGeometry args={[8.28, 0.14, 8.28]} />
        <meshStandardMaterial color={skin.felt} roughness={0.7} metalness={0.2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]} receiveShadow raycast={noRaycast}>
        <extrudeGeometry
          args={[
            frameShape,
            { depth: 0.28, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 3 },
          ]}
        />
        <meshStandardMaterial
          map={goldMap}
          metalness={0.85}
          roughness={0.28}
          emissive={skin.frame}
          emissiveIntensity={0.05}
        />
      </mesh>

      {files.map((label, i) => (
        <Label key={`f-${label}`} text={label} color={skin.frame} position={[i - 3.5, 0.42, 4.68]} />
      ))}
      {files.map((_, i) => (
        <Label key={`r-${i}`} text={String(8 - i)} color={skin.frame} position={[-4.68, 0.42, i - 3.5]} />
      ))}

      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[5.4, 5.6, 0.22, 48]} />
        <meshStandardMaterial color="#120e0c" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.92, 0]}>
        <cylinderGeometry args={[5.6, 6.15, 0.55, 48]} />
        <meshStandardMaterial color="#120e0c" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.41, 0]}>
        <torusGeometry args={[5.42, 0.04, 10, 64]} />
        <meshStandardMaterial color={skin.frame} metalness={0.85} roughness={0.28} />
      </mesh>
    </group>
  );
}

type PieceEntity = {
  id: string;
  code: PieceCode;
  square: number;
};

type MoveAnim = {
  id: string;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
};

function boardToEntities(board: (PieceCode | null)[]): PieceEntity[] {
  const out: PieceEntity[] = [];
  board.forEach((code, square) => {
    if (!code) return;
    out.push({ id: `${code}-${square}-${fileOf(square)}-${rankOf(square)}`, code, square });
  });
  return out;
}

function pieceIdAt(board: (PieceCode | null)[], square: number) {
  const code = board[square];
  if (!code) return "";
  return `${code}-${square}-${fileOf(square)}-${rankOf(square)}`;
}

function PieceView({
  ent,
  object,
  selected,
  anims,
}: {
  ent: PieceEntity;
  object: THREE.Group;
  selected: boolean;
  anims: MutableRefObject<MoveAnim[]>;
}) {
  const selectSquare = useGame((s) => s.selectSquare);
  const group = useRef<THREE.Group>(null);

  const start = (() => {
    const a = anims.current.find((m) => m.id === ent.id);
    return a ? a.from : squareToPosition(ent.square);
  })();

  useLayoutEffect(() => {
    if (!group.current) return;
    const a = anims.current.find((m) => m.id === ent.id);
    const p = a ? a.from : squareToPosition(ent.square);
    group.current.position.set(p.x, p.y + (selected && !a ? 0.12 : 0), p.z);
  }, [ent.id, ent.square, selected, anims]);

  useFrame(() => {
    if (!group.current) return;
    const a = anims.current.find((m) => m.id === ent.id);
    const lift = selected ? 0.12 : 0;
    if (a) {
      const e = 1 - Math.pow(1 - a.t, 3);
      group.current.position.set(
        a.from.x + (a.to.x - a.from.x) * e,
        a.from.y + (a.to.y - a.from.y) * e + Math.sin(e * Math.PI) * 0.35 + lift,
        a.from.z + (a.to.z - a.from.z) * e,
      );
      return;
    }
    const dest = squareToPosition(ent.square);
    dest.y += lift;
    group.current.position.lerp(dest, 0.28);
  });

  return (
    <primitive
      ref={group}
      object={object}
      position={[start.x, start.y, start.z]}
      onPointerDown={(e: { stopPropagation: () => void; clientX: number; clientY: number }) => {
        e.stopPropagation();
        markPointerDown(e.clientX, e.clientY);
      }}
      onClick={(e: { stopPropagation: () => void; clientX: number; clientY: number }) => {
        e.stopPropagation();
        if (!isTap(e.clientX, e.clientY)) return;
        selectSquare(ent.square);
      }}
    />
  );
}

function Pieces({ skin }: { skin: Skin }) {
  const board = useGame((s) => s.state.board);
  const lastMove = useGame((s) => s.state.lastMove);
  const selected = useGame((s) => s.selected);
  const lastCapture = useGame((s) => s.lastCapture);

  // Rey del Sol — modelo GLB dorado angelical
  const { scene: reySolScene } = useGLTF("/models/rey-sol.glb");

  const mats = useMemo(
    () => ({
      w: createMaterials(skin, "w"),
      b: createMaterials(skin, "b"),
    }),
    [skin],
  );

  const templates = useMemo(() => {
    const types: PieceType[] = ["P", "R", "N", "B", "Q", "K"];
    const map: Record<string, THREE.Group> = {};
    for (const side of ["w", "b"] as Side[]) {
      for (const type of types) {
        if (side === "w" && type === "K") {
          // Rey del Sol = modelo 3D personalizado
          const g = new THREE.Group();
          const model = reySolScene.clone(true);
          model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          // Ajusta escala/altura/rotación si el modelo se ve desproporcionado
          model.scale.setScalar(0.45);
          model.position.y = 0.05;
          model.rotation.y = Math.PI; // mira hacia el adversario (igual que piezas blancas)
          g.add(model);
          g.userData.pieceType = "K";
          g.userData.side = "w";
          map["wK"] = g;
        } else {
          map[`${side}${type}`] = createPieceMesh(type, side, mats[side]);
        }
      }
    }
    return map;
  }, [mats, reySolScene]);

  const entities = useMemo(() => boardToEntities(board), [board]);
  const clones = useMemo(
    () => entities.map((ent) => ({ ...ent, object: templates[ent.code].clone() })),
    [entities, templates],
  );

  const anims = useRef<MoveAnim[]>([]);
  const prevMove = useRef(lastMove);

  if (lastMove && lastMove !== prevMove.current) {
    prevMove.current = lastMove;
    const moving: MoveAnim[] = [
      {
        id: pieceIdAt(board, lastMove.to),
        from: squareToPosition(lastMove.from),
        to: squareToPosition(lastMove.to),
        t: 0,
      },
    ];
    const moved = board[lastMove.to];
    if (moved?.[1] === "K" && Math.abs(fileOf(lastMove.from) - fileOf(lastMove.to)) === 2) {
      const homeRank = rankOf(lastMove.to);
      const kingside = fileOf(lastMove.to) === 6;
      const rookTo = squareIndex(kingside ? 5 : 3, homeRank);
      const rookFrom = squareIndex(kingside ? 7 : 0, homeRank);
      moving.push({
        id: pieceIdAt(board, rookTo),
        from: squareToPosition(rookFrom),
        to: squareToPosition(rookTo),
        t: 0,
      });
    }
    anims.current = moving;
  }

  const burstRef = useRef<THREE.Points>(null);
  const burstVel = useRef<THREE.Vector3[]>([]);
  const burstAge = useRef(1);

  useEffect(() => {
    if (!lastCapture || !burstRef.current) return;
    const pos = squareToPosition(lastCapture.square, 0.4);
    const attr = burstRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    burstVel.current = [];
    for (let i = 0; i < 28; i++) {
      attr.setXYZ(i, pos.x, pos.y, pos.z);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.6;
      const speed = 0.7 + Math.random() * 1.4;
      burstVel.current.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.random() * 1.3 + 0.4,
          Math.sin(phi) * Math.sin(theta),
        ).multiplyScalar(speed),
      );
    }
    attr.needsUpdate = true;
    burstAge.current = 0;
  }, [lastCapture]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    if (anims.current.length) {
      let alive = false;
      for (const a of anims.current) {
        a.t = Math.min(1, a.t + delta / 0.28);
        if (a.t < 1) alive = true;
      }
      if (!alive) anims.current = [];
    }
    if (burstAge.current < 1 && burstRef.current) {
      burstAge.current = Math.min(1, burstAge.current + delta / 0.7);
      const attr = burstRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      burstVel.current.forEach((v, i) => {
        attr.setXYZ(
          i,
          attr.getX(i) + v.x * delta,
          attr.getY(i) + (v.y - 2.2 * burstAge.current) * delta,
          attr.getZ(i) + v.z * delta,
        );
      });
      attr.needsUpdate = true;
      const mat = burstRef.current.material as THREE.PointsMaterial;
      mat.opacity = 1 - burstAge.current;
    }
  });

  const burstGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(28 * 3), 3));
    return g;
  }, []);

  return (
    <group>
      {clones.map((ent) => (
        <PieceView
          key={ent.id}
          ent={ent}
          object={ent.object}
          selected={selected === ent.square}
          anims={anims}
        />
      ))}
      <points ref={burstRef} geometry={burstGeo} raycast={noRaycast}>
        <pointsMaterial
          color={lastCapture?.side === "w" ? skin.sunAccent : skin.moonAccent}
          size={0.1}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function Highlights() {
  const selected = useGame((s) => s.selected);
  const legal = useGame((s) => s.legal);
  const lastMove = useGame((s) => s.state.lastMove);
  const selectSquare = useGame((s) => s.selectSquare);
  return (
    <group>
      {lastMove &&
        [lastMove.from, lastMove.to].map((sq) => {
          const p = squareToPosition(sq, 0.085);
          return (
            <mesh
              key={`lm-${sq}`}
              position={[p.x, p.y, p.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              raycast={noRaycast}
            >
              <planeGeometry args={[0.98, 0.98]} />
              <meshBasicMaterial color="#c4a574" transparent opacity={0.22} />
            </mesh>
          );
        })}
      {selected !== null && (
        <mesh
          position={squareToPosition(selected, 0.09).toArray()}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={noRaycast}
        >
          <ringGeometry args={[0.3, 0.42, 32]} />
          <meshBasicMaterial color="#e8d6a4" side={THREE.DoubleSide} transparent opacity={0.95} />
        </mesh>
      )}
      {legal.map((m) => {
        const p = squareToPosition(m.to, 0.09);
        return (
          <mesh
            key={m.to}
            position={[p.x, p.y, p.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
              markPointerDown(e.clientX, e.clientY);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isTap(e.clientX, e.clientY)) return;
              selectSquare(m.to);
            }}
          >
            <ringGeometry args={m.isCapture ? [0.28, 0.4, 32] : [0.1, 0.18, 24]} />
            <meshBasicMaterial
              color={m.isCapture ? "#c45c4a" : "#8faf78"}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 48;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(p) * Math.cos(t);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(p)) * 0.7 + 1.5;
      positions[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
      // Subtle color variation: cool white / soft gold / pale blue
      const roll = Math.random();
      if (roll < 0.12) c.set("#ffe8b0");
      else if (roll < 0.28) c.set("#b8d4ff");
      else c.set("#ffffff");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.0045;
  });
  return (
    <points ref={ref} geometry={geo} raycast={noRaycast}>
      <pointsMaterial
        vertexColors
        size={0.085}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Distant planet / eclipse body for depth and rim light */
function CosmicBackdrop({ warm }: { warm: boolean }) {
  const planetRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.008;
    }
  });
  return (
    <group position={[18, 8, -28]}>
      {/* Main planet body */}
      <mesh ref={planetRef} raycast={noRaycast}>
        <sphereGeometry args={[9.5, 48, 48]} />
        <meshStandardMaterial
          color={warm ? "#1a2a48" : "#0e1628"}
          emissive={warm ? "#0a1830" : "#060c18"}
          emissiveIntensity={0.4}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>
      {/* Soft atmospheric rim */}
      <mesh scale={1.045} raycast={noRaycast}>
        <sphereGeometry args={[9.5, 32, 32]} />
        <meshBasicMaterial
          color={warm ? "#4a7ab8" : "#3a5a98"}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Subtle glow halo */}
      <mesh scale={1.12} raycast={noRaycast}>
        <sphereGeometry args={[9.5, 24, 24]} />
        <meshBasicMaterial
          color={warm ? "#6a9ad0" : "#5070b0"}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ForceCamera() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(5.4, 6.6, 7.2);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function SceneRig() {
  const skinId = useGame((s) => s.skin) as SkinId;
  const skin = SKINS[skinId];
  const turn = useGame((s) => s.state.turn);
  const flipped = useGame((s) => s.flipped);
  const phases = useGame((s) => s.phases);
  const halfmove = useGame((s) => s.state.halfmove);
  const phase: "sun" | "moon" | null = phases
    ? Math.floor(halfmove / 5) % 2 === 0
      ? "sun"
      : "moon"
    : null;
  const warm = phase === "sun" || (!phase && turn === "w");
  const group = useRef<THREE.Group>(null);
  const { scene } = useThree();

  useEffect(() => {
    // Deep space exponential fog — softer near the board, denser in the distance
    const fogColor = warm ? 0x0a0806 : 0x06080f;
    scene.fog = new THREE.FogExp2(fogColor, 0.018);
    return () => {
      scene.fog = null;
    };
  }, [scene, warm]);

  useFrame((state) => {
    if (!group.current) return;
    const sway = Math.sin(state.clock.elapsedTime * 0.15) * 0.012;
    group.current.rotation.y = (flipped ? Math.PI : 0) + sway;
  });

  return (
    <>
      <ForceCamera />
      <StudioEnvironment />
      <Lighting skin={skin} turn={turn} phase={phase} />
      <Stars />
      <CosmicBackdrop warm={warm} />
      <group ref={group}>
        <Board skin={skin} />
        <Pieces skin={skin} />
        <Highlights />
      </group>
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.55}
        scale={18}
        blur={2.8}
        far={9}
        color="#000000"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={0.35}
        maxPolarAngle={1.25}
        target={[0, 0.15, 0]}
        // Left drag rotates; clicks still reach pieces/tiles
        mouseButtons={{ LEFT: 0, MIDDLE: 1, RIGHT: 2 }}
      />
    </>
  );
}

export function ChessCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [5.4, 6.6, 7.2], fov: 38, near: 0.1, far: 90 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onPointerDown={(e) => {
        markPointerDown(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        // Only track while a button is held (primary button)
        if (e.buttons & 1) markPointerMove(e.clientX, e.clientY);
      }}
      onPointerMissed={(e) => {
        if (!isTap(e.clientX, e.clientY)) return;
        useGame.setState({ selected: null, legal: [] });
      }}
    >
      <color attach="background" args={["#050508"]} />
      <SceneRig />
    </Canvas>
  );
}
