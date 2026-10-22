const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {NtExecutable, NtExecutableResource, Resource} = require('resedit');
const root = path.resolve(__dirname, '..');
const executable = NtExecutable.from(fs.readFileSync(path.join(root, 'release/win-unpacked/VoxTexto.exe')));
const resources = NtExecutableResource.from(executable);
const version = Resource.VersionInfo.fromEntries(resources.entries)[0];
const values = version.getStringValues(version.getAllLanguagesForStringValues()[0]);
assert.equal(values.ProductName, 'VoxTexto');
assert.equal(values.FileDescription, 'VoxTexto');
const ico = fs.readFileSync(path.join(root, 'src-tauri/icons/icon.ico'));
const icons = resources.entries.filter(entry => entry.type === 3).map(entry => Buffer.from(entry.bin));
for (let i=0; i<ico.readUInt16LE(4); i++) {
  const size = ico.readUInt32LE(6+i*16+8);
  const offset = ico.readUInt32LE(6+i*16+12);
  assert.ok(icons.some(icon => icon.equals(ico.subarray(offset, offset+size))), 'Missing VoxTexto icon image in executable');
}
console.log('Verified: executable product/description VoxTexto and embedded icon matches VoxTexto ICO.');
