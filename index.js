const fs = require('fs/promises')
const path = require('path')
const Module = require('module')
const Addon = require('addon')

module.exports = async function boot (drive, opts = {}) {
  const {
    platform = process.platform,
    arch = process.arch,
    cwd = process.cwd()
  } = opts

  const previousCwd = process.cwd()

  if (cwd !== previousCwd) process.chdir(cwd)

  try {
    const root = drive.root || cwd

    const files = new Map()

    for await (const entry of drive.list()) {
      switch (path.extname(entry.key)) {
        case '.bare':
        case '.node':
          await writePrebuild(drive, entry, platform, arch)
          break

        default:
          files.set(path.join(root, entry.key), await drive.get(entry.key))
      }
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
  } finally {
    if (cwd !== previousCwd) process.chdir(previousCwd)
  }
}

async function writePrebuild (drive, entry, platform, arch) {
  if (Addon.path === null) return

  if (path.basename(path.dirname(entry.key)) !== `${platform}-${arch}`) return

  let pkg = null
  let dirname = entry.key
  do {
    dirname = path.dirname(dirname)

    pkg = await drive.get(path.join(dirname, 'package.json'))

    if (pkg) break
  } while (dirname !== '/' && dirname !== '.')

  if (pkg === null) return

  let info
  try {
    info = JSON.parse(pkg.toString())
  } catch {
    info = null
  }

  if (info === null || typeof info.name !== 'string') return

  let target = path.join(Addon.path, info.name.replace(/\//g, '+'))

  if (info.version) target += `@${info.version}`

  target += path.extname(entry.key)

  try {
    await fs.access(target)
  } catch {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, await drive.get(entry.key))
  }
}
