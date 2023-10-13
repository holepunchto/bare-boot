const path = require('path')
const Module = require('module')

module.exports = async function boot (drive) {
  const root = drive.root || '/'

  const files = new Map()

  for await (const entry of drive.list()) {
    files.set(path.join(root, entry.key), await drive.get(entry.key))
  }

  let main = path.join(root, 'index.js')

  if (files.has(path.join(root, 'package.json'))) {
    const pkg = JSON.parse(files.get(path.join(root, 'package.json')))

    if (pkg.main) {
      main = path.join(root, pkg.main)
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
