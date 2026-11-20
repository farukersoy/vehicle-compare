#!/usr/bin/env node
// Offline checks for the Commons matching / filtering rules.  node scripts/test-image-matching.mjs

import assert from 'node:assert/strict'
import { coreModel, makeMatcher, rejectReason, checkLicense } from './lib/image-match.mjs'

let passed = 0
const t = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`) }

console.log('coreModel')
t('ID.3 Pro S → ID.3', () => assert.equal(coreModel('ID.3 Pro S'), 'ID.3'))
t('Q4 e-tron 40 → Q4 e-tron', () => assert.equal(coreModel('Q4 e-tron 40'), 'Q4 e-tron'))
t('i4 eDrive40 → i4', () => assert.equal(coreModel('i4 eDrive40'), 'i4'))
t('EQA 300 4MATIC → EQA', () => assert.equal(coreModel('EQA 300 4MATIC'), 'EQA'))
t('Ioniq 5 AWD (77.4 kWh) → Ioniq 5', () => assert.equal(coreModel('Ioniq 5 AWD (77.4 kWh)'), 'Ioniq 5'))
t('Polestar 2 Long Range Dual Motor → Polestar 2', () => assert.equal(coreModel('Polestar 2 Long Range Dual Motor'), 'Polestar 2'))
t('Cooper SE keeps SE', () => assert.equal(coreModel('Cooper SE'), 'Cooper SE'))
t('NX 450h+ AWD → NX', () => assert.equal(coreModel('NX 450h+ AWD'), 'NX'))
t('Model 3 keeps 3', () => assert.equal(coreModel('Model 3 Long Range AWD'), 'Model 3'))

console.log('strict matching')
const id3 = makeMatcher('Volkswagen', 'ID.3 Pro S')
t('ID.3 matches "Volkswagen ID.3 (2023)"', () => assert.equal(id3.test('File:Volkswagen ID.3 (2023) IMG 1234.jpg').ok, true))
t('ID.3 matches "VW ID3"', () => assert.equal(id3.test('File:VW ID3 front.jpg').ok, true))
t('ID.3 never matches ID.4', () => assert.equal(id3.test('File:Volkswagen ID.4 GTX.jpg').ok, false))
t('ID.3 never matches ID.30', () => assert.equal(id3.test('File:Volkswagen ID.30.jpg').ok, false))
t('ID.3 + ID.4 in one title → ambiguous', () => assert.ok(id3.test('File:Volkswagen ID.3 and ID.4.jpg').ambiguous))

const p3 = makeMatcher('Polestar', 'Polestar 3 Long Range Dual Motor')
t('Polestar 3 matches', () => assert.equal(p3.test('File:Polestar 3 IAA 2023 1X7A0001.jpg').ok, true))
t('Polestar 3 never matches Polestar 2', () => assert.equal(p3.test('File:Polestar 2 Long Range.jpg').ok, false))
t('Polestar 3 not fooled by year 2023', () => assert.equal(p3.test('File:Polestar 2 2023.jpg').ok, false))

const cooper = makeMatcher('Mini', 'Cooper SE')
t('Cooper SE matches', () => assert.equal(cooper.test('File:Mini Cooper SE (F56) IMG.jpg').ok, true))
t('Cooper SE never matches Countryman SE', () => assert.equal(cooper.test('File:Mini Cooper SE Countryman ALL4.jpg').ok, false))

const m3 = makeMatcher('Tesla', 'Model 3 Long Range AWD')
t('Model 3 never matches Model Y', () => assert.equal(m3.test('File:Tesla Model Y 2022.jpg').ok, false))
t('Model 3 + Model 2 title → ambiguous', () => assert.ok(m3.test('File:Tesla Model 3 vs Model 2 concept.jpg').ambiguous))

const q4 = makeMatcher('Audi', 'Q4 e-tron 40')
t('Q4 e-tron matches "Audi Q4 50 e-tron quattro"', () => assert.equal(q4.test('File:2021 Audi Q4 50 e-tron quattro.jpg').ok, true))
t('Q4 e-tron rejects Sportback', () => assert.equal(q4.test('File:Audi Q4 Sportback e-tron.jpg').ok, false))
t('Q4 e-tron never matches Q8 e-tron', () => assert.equal(q4.test('File:Audi Q8 e-tron.jpg').ok, false))

const merc = makeMatcher('Mercedes', 'EQA 300 4MATIC')
t('brand alias Mercedes-Benz', () => assert.equal(merc.test('File:Mercedes-Benz EQA 250 IAA 2021.jpg').ok, true))
t('category files may omit the brand', () => assert.equal(merc.test('File:EQA 250 front.jpg', { requireBrand: false }).ok, true))

console.log('rejection filters')
const f = (title, extra = {}) => ({ title, mime: 'image/jpeg', width: 3000, height: 2000, meta: {}, ...extra })
t('accepts a normal photo', () => assert.equal(rejectReason(f('File:VW ID.3 front.jpg')), null))
t('rejects < 1200 px', () => assert.match(rejectReason(f('File:x.jpg', { width: 1000, height: 600 })), /too small/))
t('rejects portrait', () => assert.match(rejectReason(f('File:x.jpg', { width: 2000, height: 3000 })), /portrait/))
for (const w of ['Interior', 'cockpit', 'Engine', 'wheel', 'Rim', 'charging', 'Concept', 'rally', 'scale model', 'Innenraum']) {
  t(`rejects "${w}"`, () => assert.ok(rejectReason(f(`File:VW ID.3 ${w} 2023.jpg`))))
}
t('does not reject "Dual Motor"', () => assert.equal(rejectReason(f('File:Tesla Model 3 Dual Motor.jpg')), null))
t('rejects via description', () => assert.ok(rejectReason(f('File:a.jpg', { meta: { ImageDescription: '<p>Car at a charging station</p>' } }))))

console.log('licence')
t('CC BY-SA 4.0 ok', () => assert.equal(checkLicense({ LicenseShortName: 'CC BY-SA 4.0', License: 'cc-by-sa-4.0' }).ok, true))
t('CC BY 2.0 ok', () => assert.equal(checkLicense({ LicenseShortName: 'CC BY 2.0', License: 'cc-by-2.0' }).ok, true))
t('CC0 ok', () => assert.equal(checkLicense({ LicenseShortName: 'CC0', License: 'cc0' }).ok, true))
t('Public domain ok', () => assert.equal(checkLicense({ LicenseShortName: 'Public domain', License: 'pd' }).ok, true))
t('NC rejected', () => assert.equal(checkLicense({ LicenseShortName: 'CC BY-NC 2.0' }).ok, false))
t('ND rejected', () => assert.equal(checkLicense({ LicenseShortName: 'CC BY-ND 2.0' }).ok, false))
t('fair use rejected', () => assert.equal(checkLicense({ LicenseShortName: 'Fair use' }).ok, false))
t('missing rejected', () => assert.equal(checkLicense({}).ok, false))
t('GFDL-only rejected', () => assert.equal(checkLicense({ LicenseShortName: 'GFDL', License: 'gfdl' }).ok, false))

console.log(`\n${passed} checks passed`)
