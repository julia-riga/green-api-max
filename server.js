// Простой продакшн-сервер: раздаёт собранный фронтенд из ./dist
// и проксирует запросы к GREEN-API (решает проблему CORS при деплое).
// Запуск: npm run build && npm start  (или npm run deploy)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = join(__dirname, 'dist')
const PORT = Number(process.env.PORT) || 3000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function serveStatic(req, res) {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    res.writeHead(400).end('Bad request')
    return
  }

  let filePath = normalize(join(DIST, pathname))
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const info = await stat(filePath)
    if (info.isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    // SPA: неизвестный путь -> index.html
    filePath = join(DIST, 'index.html')
  }

  try {
    const data = await readFile(filePath)
    res
      .writeHead(200, {
        'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
        'Cache-Control': filePath.includes('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      })
      .end(data)
  } catch {
    res
      .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end('Сервер не найден. Сначала выполните: npm run build')
  }
}

async function proxyApi(req, res) {
  // /api/<host>/<путь...>  ->  https://<host>/<путь...>
  const m = req.url.match(/^\/api\/([^/]+)\/(.*)$/)
  if (!m) {
    res.writeHead(404).end('Not found')
    return
  }
  const target = `https://${m[1]}/${m[2]}`
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length ? Buffer.concat(chunks) : undefined

    const upstream = await fetch(target, {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body: ['POST', 'PUT', 'DELETE'].includes(req.method) ? body : undefined,
    })
    const data = await upstream.arrayBuffer()
    res
      .writeHead(upstream.status, {
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/json',
      })
      .end(Buffer.from(data))
  } catch (error) {
    res
      .writeHead(502, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ error: String(error?.message ?? error) }))
  }
}

createServer((req, res) => {
  if (req.url.startsWith('/api/')) return proxyApi(req, res)
  serveStatic(req, res)
}).listen(PORT, () => {
  console.log(`MAX-чат запущен: http://localhost:${PORT}`)
})
