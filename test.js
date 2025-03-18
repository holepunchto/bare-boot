const test = require('brittle')
const boot = require('.')
const { localdrive, hyperdrive } = require('./test/helpers')

test('file system', async (t) => {
  const drive = localdrive(t, 'test/fixtures/basic')

  t.is(await boot(drive, { cwd: await t.tmp() }), 'Hello from drive')
})

test('file system, addon', { skip: true }, async (t) => {
  const drive = localdrive(t, 'test/fixtures/addon')

  t.is(await boot(drive, { cwd: await t.tmp() }), 'Hello from addon')
})

test('memory', async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/basic').mirror(drive).done()

  t.is(await boot(drive, { cwd: await t.tmp() }), 'Hello from drive')
})

test('memory, addon', { skip: true }, async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/addon').mirror(drive).done()

  const cwd = await t.tmp()

  t.is(await boot(drive, { cwd }), 'Hello from addon')
})
