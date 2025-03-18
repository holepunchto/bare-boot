const Corestore = require('corestore')
const Hyperdrive = require('hyperdrive')
const Localdrive = require('localdrive')

exports.corestore = async function corestore(t) {
  const storage = new Corestore(await t.tmp())
  await storage.ready()

  t.teardown(() => storage.close())

  return storage
}

exports.hyperdrive = async function hypercore(t, storage) {
  const drive = new Hyperdrive(storage || (await exports.corestore(t)))
  await drive.ready()

  t.teardown(() => drive.close())

  return drive
}

exports.localdrive = function localdrive(t, root) {
  return new Localdrive(root)
}
