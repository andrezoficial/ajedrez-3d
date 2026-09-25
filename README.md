# Eclipse Eterno — Ajedrez 3D

Ajedrez 3D Sol vs Luna. SPA Vite + React Three Fiber, lista para Vercel.

El **Rey del Sol** (rey blanco) usa el modelo GLB `public/models/rey-sol.glb`.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Build de producción

```bash
npm run build
npm run preview
```

## Deploy en Vercel

### Opción A — CLI

```bash
npm i -g vercel
vercel
```

Sigue el asistente (link a tu cuenta / crea proyecto). Luego:

```bash
vercel --prod
```

### Opción B — GitHub

1. Sube este repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio.
3. Framework preset: **Vite** (auto-detectado).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy.

No hace falta configurar variables de entorno.

## Ajustar el Rey del Sol

En `src/game/ChessScene.tsx`:

```ts
model.scale.setScalar(0.45);   // tamaño
model.position.y = 0.05;       // altura
model.rotation.y = Math.PI;    // orientación
```

## Qué se eliminó del scaffold Grok

- `scripts/with-app-env.mjs` y wrappers de entorno de plataforma
- Auth federado / Better Auth / gates / broker Grok
- PGLite / migraciones / Neon
- PreviewHostBridge y rutas `/__grok/*`
- TanStack Start SSR (el juego es 100 % cliente)

El resultado es una SPA estática que Vercel sirve sin servidor Node.
