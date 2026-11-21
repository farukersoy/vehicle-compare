#!/usr/bin/env node
// Offline checks for the Commons matching / filtering rules.  node scripts/test-image-matching.mjs

import assert from 'node:assert/strict'
import {
  coreModel, makeMatcher, rejectReason, checkLicense, yearOf, checkYears, modelRejectReason,
} from './lib/image-match.mjs'

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

console.log('rear views, charging scenes')
for (const title of [
  'File:2020 Tesla Model X Dual Motor, Rear Right, 08-18-2020.jpg',
  'File:2022 Mazda CX-60 e-Skyactiv PHEV (Europe) rear view.png',
  'File:Volvo XC60 RECHARGE Plug-in Hybrid T6 AWD Inscription Expression (5LA-UB420XCP2) rear.jpg',
  'File:Opel Corsa-e Heck.jpg',
  'File:Mazda CX-60 back.jpg',
  'File:Polestar 4 Long Range Single Motor – r 14022026.jpg',
]) t(`rejects ${title}`, () => assert.match(rejectReason(f(title)), /rear view/))
t('accepts front suffix "– f 05072025"', () => assert.equal(rejectReason(f('File:Polestar 2 Long Range Dual Motor (Facelift) – f 05072025.jpg')), null))
t('accepts hatchback', () => assert.equal(rejectReason(f('File:Opel Corsa-e hatchback front.jpg')), null))
t('accepts "Recharge"', () => assert.equal(rejectReason(f('File:Volvo XC60 Recharge front.jpg')), null))
t('all-wheel drive in description is fine', () => assert.equal(rejectReason(f('File:a.jpg', { meta: { ImageDescription: 'all-wheel drive, front view' } })), null))
t('rear-wheel drive in description is fine', () => assert.equal(rejectReason(f('File:a.jpg', { meta: { ImageDescription: 'rear-wheel drive version' } })), null))
t('rejects charging in title', () => assert.ok(rejectReason(f('File:Porsche Cayenne E-Hybrid charging.jpg'))))
t('rejects charging station in description', () => assert.ok(rejectReason(f('File:x.jpg', { meta: { ImageDescription: 'at a charging station' } }))))
t('rejects Ladesäule', () => assert.ok(rejectReason(f('File:Porsche Cayenne an der Ladesäule.jpg'))))
t('rejects tire close-up', () => assert.ok(rejectReason(f('File:The tire wheel of Volvo EX30 Ultra.jpg'))))

console.log('body style')
const pan = makeMatcher('Porsche', 'Panamera')
t('Panamera rejects Sport Turismo', () => assert.equal(pan.test('File:Porsche Panamera Turbo S Sport Turismo e-hybrid.jpg').ok, false))
t('Panamera rejects Shooting Brake', () => assert.equal(pan.test('File:Porsche Panamera Shooting Brake.jpg').ok, false))
t('Panamera rejects Executive', () => assert.equal(pan.test('File:Porsche Panamera 4 E-Hybrid Executive.jpg').ok, false))
t('Panamera accepts sedan', () => assert.equal(pan.test('File:Porsche Panamera 4 E-Hybrid (G3) IAA 2023.jpg').ok, true))
t('EX30 rejects Cross Country', () => assert.equal(makeMatcher('Volvo', 'EX30 Single Motor Extended Range').test('File:Volvo EX30 Cross Country IAA 2025 DSC 1352.jpg').ok, false))
t('Panamera first generation rejected', () => assert.ok(modelRejectReason('File:PORSCHE PANAMERA FIRST GENEGRATION China (6).jpg', ['(?i:(?:first|second|1st|2nd)[ _-]?gen)'])))
t('body style in description', () => assert.equal(pan.bodyStyleIn('A Panamera Sport Turismo in white'), 'sport turismo'))
t('no body style in plain description', () => assert.equal(pan.bodyStyleIn('Porsche Panamera, front view'), undefined))

console.log('generation years')
t('title year', () => assert.deepEqual(yearOf(f('File:2019 Tesla Model 3 Long Range AWD.jpg')), { year: 2019, from: 'title' }))
t('M 93 date suffix', () => assert.equal(yearOf(f('File:Hyundai Kona Elektro (II) – f 08072024.jpg')).year, 2024))
t('yyyymmdd date', () => assert.equal(yearOf(f('File:BMW iX3, Munich (20250908-P1049823).jpg')).year, 2025))
t('model year beats photo date stamp', () => assert.deepEqual(yearOf(f('File:2018 Opel Corsa in Sovereign Silver Metallic, front left, 06-05-2025.jpg')), { year: 2018, from: 'title' }))
t('2018 Corsa rejected for 2020+', () => assert.match(checkYears(f('File:2018 Opel Corsa in Sovereign Silver Metallic, front left, 06-05-2025.jpg'), [2020, null]).reason, /older/))
t('rejects medical car', () => assert.ok(rejectReason(f('File:Porsche Cayenne (Medical Car) at the 2025 Adelaide Grand Final Parade - 02.jpg'))))
t('two-digit model year prefix', () => assert.equal(yearOf(f('File:14 Porsche Panamera Base.jpg')).year, 2014))
t("apostrophe year '12", () => assert.equal(yearOf(f("File:'12 Toyota RAV4 EV front.jpg")).year, 2012))
t('year range 2019-2023 uses 2023', () => assert.equal(yearOf(f('File:2019-2023 Toyota C-HR S-T.jpg')).year, 2023))
t('CLA rejects Shooting Break', () => assert.equal(makeMatcher('Mercedes', 'CLA 250').test('File:Mercedes-Benz CLA Shooting Break, GIMS 2019.jpg').ok, false))
t('month-year stamp ignored', () => assert.equal(yearOf(f('File:2010 KIA Sportage First Edition - 1998cc 2.0 (163PS) Petrol - Silver - 05-2024, Front.jpg')).year, 2010))
t('photo date fallback', () => assert.equal(yearOf(f('File:Nissan Leaf.jpg', { meta: { DateTimeOriginal: '2021-05-02 10:00:00' } })).year, 2021))
t('Flickr id is no year', () => assert.equal(yearOf(f('File:Renault Captur (53326575621).jpg')), null))
t('Leaf 2012 rejected for 2018–2025', () => assert.match(checkYears(f("File:Nissan Leaf - Mondial de l'Automobile de Paris 2012 - 006.jpg"), [2018, 2025]).reason, /older/))
t('Leaf 2026 rejected for 2018–2025', () => assert.match(checkYears(f('File:2026 Nissan Leaf.jpg'), [2018, 2025]).reason, /newer/))
t('3008 2021 rejected for 2024+', () => assert.ok(checkYears(f('File:2021 Peugeot 3008 B Hybrid4 1X7A0141.jpg'), [2024, null]).reason))
t('in range', () => assert.equal(checkYears(f('File:2024 Peugeot E-3008.jpg'), [2024, null]).year.year, 2024))
t('unknown year flagged', () => assert.equal(checkYears(f('File:Peugeot 3008.jpg'), [2024, null]).unknown, true))
t('no range → no check', () => assert.deepEqual(checkYears(f('File:x 1999.jpg'), undefined), {}))
const corsaReject = ['\\([A-E]\\)', 'Corsa[ _][A-E](?![-\\w])']
t('Corsa (E) generation code rejected', () => assert.ok(modelRejectReason('File:Opel Corsa 1.3 CDTI ecoFLEX Innovation (E) – Frontansicht.jpg', corsaReject)))
t('"Corsa E" generation rejected', () => assert.ok(modelRejectReason('File:Opel Corsa E 1.4.jpg', corsaReject)))
t('"Corsa-e" kept', () => assert.equal(modelRejectReason('File:Opel Corsa-e Elegance (F) – f 2021.jpg', corsaReject), null))

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
