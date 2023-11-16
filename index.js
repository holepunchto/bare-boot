const fs = require('bare-fs/promises')
const path = require('bare-path')
const os = require('bare-os')
const Module = require('bare-module')

module.exports = async function boot (drive, opts = {}) {
  const {
    platform = os.platform(),
    arch = os.arch(),
    cwd = os.cwd()
  } = opts

  const previousCwd = os.cwd()

  if (cwd !== previousCwd) os.chdir(cwd)

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
        preresolve (specifier, dirname) {
          if (specifier[0] === '.') specifier = path.join(dirname, specifier)
          else if (path.isAbsolute(specifier)) specifier = path.normalize(specifier)

          return specifier
        },

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
    if (cwd !== previousCwd) os.chdir(previousCwd)
  }
}

async function writePrebuild (drive, entry, platform, arch) {
  if (path.basename(path.dirname(entry.key)) !== `${platform}-${arch}`) return

  let pkg = null
  let dirname = entry.key
  do {
    dirname = path.dirname(dirname)

    pkg = await drive.get(path.join(dirname, 'package.json'))

    if (pkg) break
  } while (dirname !== '/' && dirname !== '.')

  if (pkg === null) return

  let info = null
  try {
    info = JSON.parse(pkg.toString())
  } catch {}

  if (info === null || typeof info.name !== 'string') return

  let target = path.resolve('prebuilds', `${platform}-${arch}`, info.name.replace(/\//g, '+'))

  if (info.version) target += `@${info.version}`

  target += path.extname(entry.key)

  try {
    await fs.access(target)
  } catch {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, await drive.get(entry.key))
  }
}
