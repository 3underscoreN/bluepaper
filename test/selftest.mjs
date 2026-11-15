import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { deflateRawSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { fixText, initials, formatBirthday, Zip, ZipSet } = require('../app.js');

// The export's double-encoded UTF-8, a normal Latin-1 string, and a normal emoji.
const mojibake = Buffer.from('ケルビン　晨', 'utf8').toString('latin1');
assert.equal(fixText(mojibake), 'ケルビン　晨');
assert.equal(fixText('café'), 'café');
assert.equal(fixText('Hello'), 'Hello');
assert.equal(fixText('🤨'), '🤨');
assert.equal(initials('Kelvin Chan'), 'KC');
assert.equal(formatBirthday({ month: 6, day: 26, year: 2004 }), '2004年6月26日');

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}

// A one-entry DEFLATE zip, enough to exercise the central-directory reader.
function makeZip(name, text) {
  const nameBytes = Buffer.from(name, 'utf8');
  const data = Buffer.from(text, 'utf8');
  const compressed = deflateRawSync(data);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE(0, 42);

  const cdOffset = local.length + nameBytes.length + compressed.length;
  const cdSize = central.length + nameBytes.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(cdOffset, 16);

  return Buffer.concat([local, nameBytes, compressed, central, nameBytes, end]);
}

const zip = new Zip(new Blob([makeZip('prefix/your_facebook_activity/posts/posts.json', JSON.stringify({ name: mojibake }))]));
await zip.open();
const entry = zip.find('your_facebook_activity/posts/posts.json');
assert.ok(entry, 'suffix path lookup finds nested archive entries');
assert.deepEqual(await zip.json(entry), { name: 'ケルビン　晨' });

// Same archive, but with the ZIP64 end record and 64-bit extras.
function makeZip64(name, text) {
  const nameBytes = Buffer.from(name, 'utf8');
  const data = Buffer.from(text, 'utf8');
  const compressed = deflateRawSync(data);
  const crc = crc32(data);

  const localExtra = Buffer.alloc(20);
  localExtra.writeUInt16LE(0x0001, 0);
  localExtra.writeUInt16LE(16, 2);
  localExtra.writeBigUInt64LE(BigInt(data.length), 4);
  localExtra.writeBigUInt64LE(BigInt(compressed.length), 12);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(45, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(0xffffffff, 18);
  local.writeUInt32LE(0xffffffff, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(localExtra.length, 28);

  const centralExtra = Buffer.alloc(28);
  centralExtra.writeUInt16LE(0x0001, 0);
  centralExtra.writeUInt16LE(24, 2);
  centralExtra.writeBigUInt64LE(BigInt(data.length), 4);
  centralExtra.writeBigUInt64LE(BigInt(compressed.length), 12);
  centralExtra.writeBigUInt64LE(0n, 20);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(45, 4);
  central.writeUInt16LE(45, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(0xffffffff, 20);
  central.writeUInt32LE(0xffffffff, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt16LE(centralExtra.length, 30);
  central.writeUInt32LE(0xffffffff, 42);

  const localPart = Buffer.concat([local, nameBytes, localExtra, compressed]);
  const cdOffset = localPart.length;
  const centralPart = Buffer.concat([central, nameBytes, centralExtra]);
  const cdSize = centralPart.length;
  const z64Offset = cdOffset + cdSize;

  const z64 = Buffer.alloc(56);
  z64.writeUInt32LE(0x06064b50, 0);
  z64.writeBigUInt64LE(44n, 4);
  z64.writeUInt16LE(45, 12);
  z64.writeUInt16LE(45, 14);
  z64.writeBigUInt64LE(1n, 24);
  z64.writeBigUInt64LE(1n, 32);
  z64.writeBigUInt64LE(BigInt(cdSize), 40);
  z64.writeBigUInt64LE(BigInt(cdOffset), 48);

  const locator = Buffer.alloc(20);
  locator.writeUInt32LE(0x07064b50, 0);
  locator.writeBigUInt64LE(BigInt(z64Offset), 8);
  locator.writeUInt32LE(1, 16);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0xffff, 8);
  end.writeUInt16LE(0xffff, 10);
  end.writeUInt32LE(0xffffffff, 12);
  end.writeUInt32LE(0xffffffff, 16);

  return Buffer.concat([localPart, centralPart, z64, locator, end]);
}

const zip64 = new Zip(new Blob([makeZip64('prefix/your_facebook_activity/posts/big.json', JSON.stringify({ name: mojibake }))]));
await zip64.open();
const zip64Entry = zip64.find('your_facebook_activity/posts/big.json');
assert.ok(zip64Entry, 'ZIP64 suffix path lookup finds nested archive entries');
assert.deepEqual(await zip64.json(zip64Entry), { name: 'ケルビン　晨' });

// A split export: two parts with separate paths, read as one archive.
const zipSet = new ZipSet([
  new Blob([makeZip('part1/your_facebook_activity/posts/a.json', JSON.stringify({ part: 1 }))]),
  new Blob([makeZip('part2/your_facebook_activity/posts/b.json', JSON.stringify({ part: 2 }))]),
]);
await zipSet.open();
assert.equal(zipSet.findAll(/\/posts\/[^/]+\.json$/).length, 2, 'both archive parts are discoverable');
assert.deepEqual(await zipSet.json(zipSet.find('your_facebook_activity/posts/a.json')), { part: 1 });
assert.deepEqual(await zipSet.json(zipSet.find('your_facebook_activity/posts/b.json')), { part: 2 });

// Both interface languages must stay complete.
const localeContext = { window: {} };
vm.createContext(localeContext);
for (const file of ['en.js', 'zh-Hant.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../i18n/${file}`, import.meta.url), 'utf8'), localeContext);
}
assert.deepEqual(
  Object.keys(localeContext.window.I18N['zh-Hant']).sort(),
  Object.keys(localeContext.window.I18N.en).sort(),
  'English and Traditional Chinese dictionaries must have the same keys',
);

console.log('selftest: passed (including ZIP64 and i18n key parity)');
