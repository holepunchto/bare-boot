const test = require('brittle')
const fs = require('bare-fs')
const path = require('bare-path')
const tmp = require('test-tmp')
const boot = require('.')
const { localdrive, hyperdrive } = require('./test/helpers')

test('file system', async (t) => {
  const drive = localdrive(t, 'test/fixtures/basic')

  t.is(await boot(drive, { cwd: await tmp(t) }), 'Hello from drive')
})

test('file system, addon', async (t) => {
  const drive = localdrive(t, 'test/fixtures/addon')

  t.is(await boot(drive, { cwd: await tmp(t) }), 'Hello from addon')
})

test('memory', async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/basic').mirror(drive).done()

  t.is(await boot(drive, { cwd: await tmp(t) }), 'Hello from drive')
})

test('memory, addon', async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/addon').mirror(drive).done()

  const cwd = await tmp(t)

  t.is(await boot(drive, { cwd }), 'Hello from addon')
})
