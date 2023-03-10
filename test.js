const test = require('brittle')
const boot = require('.')
const { localdrive, hyperdrive } = require('./test/helpers')

test('file system', async (t) => {
  const drive = localdrive(t, 'test/fixtures/module')

  t.is(await boot(drive), 'Hello from drive')
})

test('memory', async (t) => {
  const drive = await hyperdrive(t)

  await drive.put('package.json', '{ "main": "entry.js" }')
  await drive.put('entry.js', 'module.exports = \'Hello from drive\'')

  t.is(await boot(drive), 'Hello from drive')
})
