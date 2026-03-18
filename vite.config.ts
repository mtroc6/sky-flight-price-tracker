import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function vercelApiPlugin(): Plugin {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        try {
          // Parse URL and query
          const url = new URL(req.url, `http://${req.headers.host}`)
          const query: Record<string, string | string[]> = {}
          url.searchParams.forEach((value, key) => {
            query[key] = value
          })

          // Read body for POST/PATCH/PUT
          let body: unknown = undefined
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(chunk as Buffer)
            }
            const raw = Buffer.concat(chunks).toString()
            if (raw) {
              try { body = JSON.parse(raw) } catch { body = raw }
            }
          }

          // Map URL path to handler file
          let handlerPath = req.url.split('?')[0] // e.g. /api/locations/search

          // Handle dynamic routes like /api/watchlist/123 → api/watchlist/[id].ts
          // and /api/prices/123 → api/prices/[routeId].ts
          const segments = handlerPath.replace('/api/', '').split('/')
          let modulePath: string | null = null
          const params: Record<string, string> = {}

          // Try exact match first
          const exactPath = path.resolve(__dirname, `.${handlerPath}.ts`)
          const indexPath = path.resolve(__dirname, `.${handlerPath}/index.ts`)

          const fs = await import('fs')
          if (fs.existsSync(exactPath)) {
            modulePath = exactPath
          } else if (fs.existsSync(indexPath)) {
            modulePath = indexPath
          } else {
            // Try dynamic route: replace last segment with [param]
            const parentDir = path.resolve(__dirname, `./api/${segments.slice(0, -1).join('/')}`)
            if (fs.existsSync(parentDir)) {
              const files = fs.readdirSync(parentDir)
              const dynamicFile = files.find(f => f.startsWith('[') && f.endsWith('].ts'))
              if (dynamicFile) {
                modulePath = path.join(parentDir, dynamicFile)
                const paramName = dynamicFile.slice(1, -4) // [id].ts → id
                params[paramName] = segments[segments.length - 1]
              }
            }
          }

          if (!modulePath) return next()

          // Load handler via Vite's SSR module loader (handles TypeScript)
          const mod = await server.ssrLoadModule(modulePath)
          const handler = mod.default

          if (typeof handler !== 'function') return next()

          // Create mock VercelRequest/VercelResponse
          const mockReq = Object.assign(req, {
            query: { ...query, ...params },
            body,
          })

          const mockRes = {
            _statusCode: 200,
            _headers: {} as Record<string, string>,
            _body: null as unknown,
            status(code: number) { this._statusCode = code; return this },
            setHeader(key: string, value: string) { this._headers[key] = value; return this },
            json(data: unknown) {
              res.writeHead(this._statusCode, {
                'Content-Type': 'application/json',
                ...this._headers,
              })
              res.end(JSON.stringify(data))
              return this
            },
            send(data: unknown) {
              res.writeHead(this._statusCode, this._headers)
              res.end(typeof data === 'string' ? data : JSON.stringify(data))
              return this
            },
            end() { res.end(); return this },
          }

          await handler(mockReq, mockRes)
        } catch (err) {
          console.error('[api error]', err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
