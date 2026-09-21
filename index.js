const path = require('bare-path')
const url = require('bare-url')
const fs = require('bare-fs/promises')
const Module = require('bare-module')

const addon = /\.(bare|node)$/

module.exports = async function boot(drive, entry = '/index.js', opts = {}) {
  if (typeof entry === 'object' && entry !== null) {
    opts = entry
    entry = '/index.js'
  }

  const { cwd = '.' } = opts

  const base = url.pathToFileURL(path.resolve(cwd) + path.sep)

  const assets = new Set()

  const protocol = new Module.Protocol({
    async exists(url) {
      if (url.protocol !== 'drive:') return false

      const entry = await drive.entry(url.pathname)

      return entry !== null
    },

    read(url) {
      return url.protocol === 'drive:' ? drive.get(url.pathname) : null
    },

    list(url) {
      assets.add(url.href)

      return listPrefix(url)
    },

    resolve(url) {
      if (assets.has(url.href) || addon.test(url.pathname)) return offload(url)

      return url
    }
  })

  const module = await Module.load(new URL(entry, 'drive:///'), { protocol })

  return module.exports

  async function* listPrefix(prefix) {
    if ((await drive.entry(prefix.pathname)) !== null) return yield prefix

    let folder = prefix.pathname

    if (folder[folder.length - 1] !== '/') folder += '/'

    for await (const { key } of drive.list(folder, { recursive: true })) {
      yield new URL(key, prefix)
    }
  }

  async function offload(href) {
    for await (const source of listPrefix(href)) {
      const file = offloaded(source)

      await fs.mkdir(new URL('.', file), { recursive: true })
      await fs.writeFile(file, await drive.get(source.pathname))
    }

    return offloaded(href)
  }

  function offloaded(href) {
    return new URL(href.pathname.slice(1), base)
  }
}
