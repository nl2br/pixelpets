const express = require('express')
const httpProxy = require('http-proxy')
const morgan = require('morgan')

const app = express()
app.use(morgan('tiny'))

const PETS_TARGET = process.env.PETS_URL || 'http://pets:3000'
const AI_TARGET   = process.env.AI_URL   || 'http://ai:3000'

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ignorePath: false,
  proxyTimeout: 120000,
})

// --- PROXY D'ABORD ---
app.use('/api/ai', (req, res) => {
  console.log('[GW-IN][AI]', req.method, req.originalUrl)
  req.url = req.originalUrl.replace(/^\/api/, '')
  proxy.web(req, res, { target: AI_TARGET }, (err) => {
    console.error('proxy error(ai):', err.message)
    if (!res.headersSent) res.status(502).json({ error:'bad_gateway', detail: err.message })
  })
})

app.use('/api', (req, res) => {
  console.log('[GW-IN][PETS]', req.method, req.originalUrl)
  req.url = req.originalUrl.replace(/^\/api/, '')
  proxy.web(req, res, { target: PETS_TARGET }, (err) => {
    console.error('proxy error(pets):', err.message)
    if (!res.headersSent) res.status(502).json({ error:'bad_gateway', detail: err.message })
  })
})

// --- ROUTES NON-PROXY : body-parser OK ici ---
app.use(express.json())
app.get('/health', (_req, res) =>
  res.json({ status:'ok', service:'api-gateway', pets:PETS_TARGET, ai:AI_TARGET })
)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`api-gateway listening on ${port}`))
