const path = require('bare-path')
const url = require('bare-url')
const fs = require('bare-fs/promises')
const pack = require('bare-pack-drive')
const Module = require('bare-module')
const { resolve } = require('bare-module-traverse')

module.exports = async function boot(drive, entry = '/index.js', opts = {}) {
  if (typeof entry === 'object' && entry !== null) {
    opts = entry
    entry = '/index.js'
  }

  const { host, cwd = '.' } = opts

  // Addons and assets must reside on disk to be loaded, so offload them next to
  // `cwd` and rewrite their resolutions to point at the written files.
  const base = url.pathToFileURL(path.resolve(cwd) + path.sep)

  const bundle = await pack(drive, entry, writeFile, {
    host,
    resolve: resolve.bare,
    offload: true
  })

  const module = Module.load(new URL(`drive:///${path.basename(entry)}.bundle`), bundle, {
    cache: Object.create(null)
  })

  return module.exports

  async function writeFile(href, source) {
    const file = new URL(href.pathname.slice(1), base)

    await fs.mkdir(new URL('.', file), { recursive: true })
    await fs.writeFile(file, source)

    return file
  }
}
