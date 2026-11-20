# Import report

- Mode: **APPLY** · 2026-11-20 23:13
- Input: `sample.md` (12 data rows)
- Dataset before: 80 vehicles · new: **7** · after: 87
- Existing vehicles: 1 optional fields added · 0 values changed · 1 differences not applied
- Skipped: 2 · conflicts: 1 · flagged: 2 (0 allowed)
- id rule check: 79/79 existing ids match the slug rule

## New vehicles

| id | brand | model | type | kWh/100 | L/100 | range | silhouette | segment | rule | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| xiaomi-su7 | Xiaomi | SU7 | BEV | 17.5 | 0 | 560 | sedan | Sedan | keyword:su7 | unknown brand |
| volkswagen-id7-pro | Volkswagen | ID.7 Pro | BEV | 16.8 | 0 | 520 | sedan | Sedan | keyword:id\.? ?7(?! tourer) |  |
| kia-ev3-long-range | Kia | EV3 Long Range | BEV | 16.2 | 0 | 480 | suv | SUV | keyword:ev[3-6] |  |
| renault-5-e-tech-52-kwh | Renault | 5 E-Tech 52 kWh | BEV | 15.6 | 0 | 360 | hatchback | Kompakt | keyword:renault 5 |  |
| toyota-c-hr-plug-in-hybrid | Toyota | C-HR Plug-in Hybrid | PHEV | 14 | 1.2 | 610 | suv | SUV | keyword:c-hr | no empty-battery value (app keeps full-battery value) |
| mercedes-cla-250 | Mercedes | CLA 250+ | BEV | 13.9 | 0 | 620 | sedan | Sedan | keyword:cla |  |
| hyundai-inster-long-range | Hyundai | Inster Long Range | BEV | 14.9 | 0 | 330 | city-car | Kleinwagen | keyword:inster |  |

## Existing vehicles

Missing optional fields added:

| id | field | value | source |
| --- | --- | --- | --- |
| audi-q4-e-tron-40 | rangeKm | 410 | sample.md:18 |

Differences NOT applied (run with `--update-existing` to overwrite):

| id | field | old | new | source |
| --- | --- | --- | --- | --- |
| audi-q4-e-tron-40 | electricKwh100km | 19.3 | 18.5 | sample.md:18 |

## Flagged rows

Not imported unless their id is listed in `scripts/import-allow.json`.

| id | source | reasons | status |
| --- | --- | --- | --- |
| skoda-elroq-85 | sample.md:28 | BEV kWh 45 outside 10–30 | not imported |
| bmw-ix1-xdrive30 | sample.md:29 | cost mismatch: Gemini CHF 6.20 vs recomputed 4.95 (20%) | not imported |

## Conflicts

| id | first | values | later | values | resolution |
| --- | --- | --- | --- | --- | --- |
| volkswagen-id7-pro | sample.md:13 | 16.8 kWh · 0 L | sample.md:27 | 17.1 kWh · 0 L | first row kept |

## Skipped

| source | vehicle | reason |
| --- | --- | --- |
| sample.md:19 | Opel Grandland PHEV 4×4 | reference vehicle (Opel Grandland) is never imported |
| sample.md:27 | Volkswagen ID.7 Pro | duplicate of sample.md:13 with different numbers (conflict) |

## Warnings

- Unknown brand "Xiaomi": guessed domain xiaomi.com, neutral colour #64748B (added to src/data/brands.ts – please verify)

## Per brand

| brand | before | new | after |
| --- | --- | --- | --- |
| Alfa Romeo | 2 |  | 2 |
| Audi | 3 |  | 3 |
| BMW | 3 |  | 3 |
| Citroën | 3 |  | 3 |
| Cupra | 3 |  | 3 |
| Dacia | 2 |  | 2 |
| Fiat | 2 |  | 2 |
| Ford | 3 |  | 3 |
| Honda | 2 |  | 2 |
| Hyundai | 3 | 1 | 4 |
| Jaguar | 1 |  | 1 |
| Kia | 3 | 1 | 4 |
| Land Rover | 3 |  | 3 |
| Lexus | 2 |  | 2 |
| Mazda | 2 |  | 2 |
| Mercedes | 3 | 1 | 4 |
| Mini | 2 |  | 2 |
| Mitsubishi | 3 |  | 3 |
| Nissan | 2 |  | 2 |
| Opel | 3 |  | 3 |
| Peugeot | 3 |  | 3 |
| Polestar | 3 |  | 3 |
| Porsche | 3 |  | 3 |
| Renault | 3 | 1 | 4 |
| Seat | 2 |  | 2 |
| Skoda | 3 |  | 3 |
| Subaru | 1 |  | 1 |
| Tesla | 3 |  | 3 |
| Toyota | 3 | 1 | 4 |
| Volkswagen | 3 | 1 | 4 |
| Volvo | 3 |  | 3 |
| Xiaomi | 0 | 1 | 1 |
