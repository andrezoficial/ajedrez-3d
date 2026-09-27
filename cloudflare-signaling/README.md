# Relay de señalización WebRTC — Cloudflare Workers

Reemplaza el relay de señalización (antes en Postgres/Vercel) por un Worker de
Cloudflare con un Durable Object por sala. No necesita base de datos: cada
partida en línea vive en su propio Durable Object mientras dura la conexión.

## Desplegar

```bash
cd cloudflare-signaling
npm install
npx wrangler login          # una vez, abre el navegador
npm run deploy
```

Al terminar, wrangler imprime una URL como:

```
https://eclipse-eterno-rtc.<tu-subdominio>.workers.dev
```

## Conectar la app (en Vercel)

En el proyecto de Vercel (el ajedrez), agrega esta variable de entorno y
vuelve a desplegar:

```
VITE_RTC_URL = https://eclipse-eterno-rtc.<tu-subdominio>.workers.dev
```

Si no defines `VITE_RTC_URL`, la app sigue usando la ruta interna
`/api/rtc` (la que requiere Postgres) como respaldo.

## (Opcional) restringir el origen

Por defecto el Worker acepta peticiones desde cualquier origen (`*`). Para
restringirlo a tu dominio de Vercel, descomenta en `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://tu-app.vercel.app"
```

y vuelve a correr `npm run deploy`.

## Probar en local

```bash
npm run dev
```

Levanta el worker en `http://localhost:8787` vía Miniflare (necesita salida
a internet para inicializar; no funciona detrás de un proxy muy restrictivo).
