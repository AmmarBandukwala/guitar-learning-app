// Captures a screenshot of the running app using headless Chrome over the
// DevTools Protocol. Uses Node's built-in WebSocket + fetch, so it adds no
// dependencies. Requires the dev server to be running.
//
//   npm run dev        # in one shell
//   npm run screenshot # in another

import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.argv[2] ?? 'docs/screenshot.png'
const URL_TO_SHOOT = process.env.SHOT_URL ?? 'http://localhost:5199/'
const DEBUG = 'http://127.0.0.1:9222'
const WIDTH = Number(process.env.SHOT_WIDTH ?? 1440)
const HEIGHT = Number(process.env.SHOT_HEIGHT ?? 1250)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Connect to a *page* target (Page.* domain is not available on the
// browser-level endpoint that /json/version advertises).
async function targetWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${DEBUG}/json/list`)
      const targets = await res.json()
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // Chrome not up yet
    }
    await sleep(250)
  }
  throw new Error('No Chrome page target reachable at ' + DEBUG)
}

// Minimal CDP client: promise-based send() over a single WebSocket.
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let nextId = 1
  const pending = new Map()
  const events = []

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString())
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) {
        reject(new Error(JSON.stringify(msg.error)))
      } else {
        resolve(msg.result)
      }
    } else if (msg.method) {
      events.push(msg)
    }
  })

  const open = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', () => reject(new Error('websocket error')))
  })

  return {
    ready: open,
    send(method, params = {}) {
      const id = nextId++
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        ws.send(JSON.stringify({ id, method, params }))
      })
    },
    saw(method) {
      return events.some((e) => e.method === method)
    },
    close: () => ws.close(),
  }
}

async function main() {
  const url = await targetWsUrl()
  const cdp = connect(url)
  await cdp.ready

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 2,
    mobile: false,
  })

  await cdp.send('Page.navigate', { url: URL_TO_SHOOT })

  // Wait for load, then for React to paint.
  for (let i = 0; i < 60 && !cdp.saw('Page.loadEventFired'); i++) await sleep(250)
  await sleep(1200)

  // The solo panel starts collapsed and the tab only appears after generating,
  // so drive the same clicks a user would.
  const drive = async (js) => {
    const r = await cdp.send('Runtime.evaluate', {
      expression: js,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
    return r.result?.value
  }

  const expanded = await drive(`(() => {
    const h = document.querySelector('.solo-header')
    if (!h) return 'no .solo-header'
    h.click()
    return 'clicked'
  })()`)
  await sleep(600)

  const generated = await drive(`(() => {
    const b = [...document.querySelectorAll('button')]
      .find((x) => x.textContent.trim() === 'Generate Solo')
    if (!b) return 'no generate button'
    b.click()
    return 'clicked'
  })()`)
  await sleep(900)

  // The #root column is capped at 960px, which clips an 8-bar phrase inside the
  // horizontal scroller. For a static screenshot we relax that cap so the whole
  // phrase is visible. This only affects the capture, never the source.
  if (process.env.SHOT_APP_MAX_WIDTH) {
    await drive(`(() => {
      const s = document.createElement('style')
      s.textContent = '#root { max-width: ${process.env.SHOT_APP_MAX_WIDTH}px !important; }'
      document.head.appendChild(s)
      return 'ok'
    })()`)
    await sleep(400)
  }

  const state = await drive(`(() => {
    const pre = document.querySelector('.tab-ascii')
    return {
      expanded: !!document.querySelector('.solo-generator.is-expanded'),
      hasAsciiTab: !!pre,
      tabPreview: pre?.textContent?.slice(0, 40) ?? null,
      // scrollWidth > clientWidth means the tab is clipped by the scroller.
      tabScrollWidth: pre?.scrollWidth ?? 0,
      tabClientWidth: pre?.clientWidth ?? 0,
      clipped: pre ? pre.scrollWidth > pre.clientWidth + 1 : null,
    }
  })()`)

  console.log('expand:', expanded, '| generate:', generated)
  console.log('state :', JSON.stringify(state))
  if (state.clipped) {
    console.log(
      `NOTE  : tab is clipped (${state.tabScrollWidth} > ${state.tabClientWidth}); ` +
        'raise SHOT_WIDTH so the whole phrase fits.',
    )
  }

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const dir = OUT.slice(0, OUT.lastIndexOf('/'))
  if (dir) mkdirSync(dir, { recursive: true })
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
  console.log('wrote :', OUT)

  cdp.close()
}

main().catch((err) => {
  console.error('screenshot failed:', err.message)
  process.exit(1)
})
