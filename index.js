const path = require('path')
const Module = require('module')

module.exports = async function boot (drive) {
  const files = new Map()

  for await (const entry of drive.list()) {
    files.set(entry.key, await drive.get(entry.key))
  }

  const pkg = JSON.parse(files.get('/package.json'))

  const main = path.resolve('/', pkg.main || 'index.js')

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
