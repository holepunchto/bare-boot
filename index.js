const path = require('path')
const Module = require('module')

module.exports = async function boot (drive) {
  const files = new Map()

  for await (const entry of drive.list()) {
    files.set(entry.key, await drive.get(entry.key))
  }

  let main = '/index.js'

  if (files.has('/package.json')) {
    const pkg = JSON.parse(files.get('/package.json'))

    if (pkg.main) {
      main = path.resolve('/', pkg.main)
    }
  }

  const module = Module.load(main, {
    protocol: new Module.Protocol({
      exists (filename) {
        return files.has(filename)
      },

      read (filename) {
        return files.get(filename)
      }
    })
  })

  return module.exports
}
