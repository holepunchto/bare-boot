const path = require('path')
const Module = require('module')
const ScriptLinker = require('script-linker')
const Bundle = require('@pearjs/bundle')

module.exports = async function boot (drive, opts = {}) {
  const linker = new ScriptLinker({
    async readFile (filename) {
      const buffer = await drive.get(filename)
      if (!buffer) {
        const err = new Error(`ENOENT: ${filename}`)
        err.code = 'ENOENT'
        throw err
      }
      return buffer
    },

    builtins: {
      has () {
        return false
      },
      async get () {
        return null
      },
      keys () {
        return []
      }
    }
  })

  const pkg = JSON.parse(await drive.get('package.json'))

  const main = path.resolve('/', pkg.main || 'index.js')

  const bundle = new Bundle()

  for await (const { module } of linker.dependencies(main)) {
    if (module.builtin) continue

    if (module.package) {
      const source = JSON.stringify(module.package, null, 2)

      bundle.write(module.packageFilename, source + '\n')
    }

    bundle.write(module.filename, module.source, {
      main: module.filename === main
    })
  }

  const mounted = bundle.mount(drive.root || path.resolve('/', drive.key.toString('hex')))

  return Module.load(`${mounted.main}.bundle`, mounted.toBuffer()).exports
}
