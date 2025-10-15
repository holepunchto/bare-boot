const path = require('bare-path')
const pack = require('bare-pack-drive')
const Module = require('bare-module')
const { resolve } = require('bare-module-traverse')

module.exports = async function boot(drive, entry = '/index.js', opts = {}) {
  if (typeof entry === 'object' && entry !== null) {
    opts = entry
    entry = '/index.js'
  }

  const { platform, arch, simulator, target } = opts

  const bundle = await pack(drive, entry, {
    platform,
    arch,
    simulator,
    target,
    resolve: resolve.bare
  })

  const module = Module.load(new URL(`drive:///${path.basename(entry)}.bundle`), bundle, {
    cache: Object.create(null)
  })

  return module.exports
}
