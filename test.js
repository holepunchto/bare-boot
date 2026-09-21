const test = require('brittle')
const fs = require('bare-fs/promises')
const path = require('bare-path')
const tmp = require('test-tmp')
const boot = require('.')
const { localdrive, hyperdrive } = require('./test/helpers')

test('file system', async (t) => {
  const drive = localdrive(t, 'test/fixtures/basic')

  t.is(await boot(drive, '/entry.js', { cwd: await tmp() }), 'Hello from drive')
})

test('file system, addon', async (t) => {
  const drive = localdrive(t, 'test/fixtures/addon')

  t.is(await boot(drive, '/entry.js', { cwd: await tmp() }), 'Hello from addon')
})

test('memory', async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/basic').mirror(drive).done()

  t.is(await boot(drive, '/entry.js', { cwd: await tmp() }), 'Hello from drive')
})

test('memory, addon', async (t) => {
  const drive = await hyperdrive(t)

  await localdrive(t, 'test/fixtures/addon').mirror(drive).done()

  t.is(await boot(drive, '/entry.js', { cwd: await tmp() }), 'Hello from addon')
})

test('module collision', async (t) => {
  const a = localdrive(t, 'test/fixtures/collision/a')
  const b = localdrive(t, 'test/fixtures/collision/b')

  t.is(await boot(a), 'Hello A')
  t.is(await boot(b), 'Hello B')
})

test('file system, asset', async (t) => {
  const drive = localdrive(t, 'test/fixtures/asset')
  const cwd = await tmp()

  const [file, folder] = await boot(drive, '/entry.js', { cwd })

  t.is(file, path.join(cwd, 'asset.txt'))
  t.is(await fs.readFile(file, 'utf8'), 'Hello from asset')

  t.is(folder, path.join(cwd, 'assets'))
  t.is(await fs.readFile(path.join(folder, 'a.txt'), 'utf8'), 'Hello from a')
  t.is(await fs.readFile(path.join(folder, 'nested/b.txt'), 'utf8'), 'Hello from b')
})

test('memory, asset', async (t) => {
  const drive = await hyperdrive(t)
  const cwd = await tmp()

  await localdrive(t, 'test/fixtures/asset').mirror(drive).done()

  const [file, folder] = await boot(drive, '/entry.js', { cwd })

  t.is(file, path.join(cwd, 'asset.txt'))
  t.is(await fs.readFile(file, 'utf8'), 'Hello from asset')

  t.is(folder, path.join(cwd, 'assets'))
  t.is(await fs.readFile(path.join(folder, 'a.txt'), 'utf8'), 'Hello from a')
  t.is(await fs.readFile(path.join(folder, 'nested/b.txt'), 'utf8'), 'Hello from b')
})
