# TEST DATA — not real measurements

This file exercises the importer (new brand, existing vehicle with a different
value, implausible row, Opel row, duplicate, decimal commas, empty cells,
bold, footnotes, repeated header, two tables). Files named `sample*` are
skipped by `npm run import-data` unless `--include-sample` is passed.

## Elektro und Plug-in, Teil 1

| Marke | Modell | Antrieb | Stromverbrauch kWh/100km | Benzinverbrauch L/100km | Kosten CHF/100km (Hausstrom) | CO2 g/km | Reale Reichweite km |
|---|---|---|---|---|---|---|---|
| **Xiaomi** | SU7 | BEV | 17,5 | - | 4,87 | 0 | 560 |
| Volkswagen | ID.7 Pro | BEV | 16.8 | n/a | 4.67 | 0 | 520 |
| Kia | EV3 Long Range | BEV |  16,2  | – | 4,50 | 0 | 480¹ |
| Renault | 5 E-Tech 52 kWh | BEV | 15,6 | n/a | 4,34 | 0 | 360 |
| Toyota | C-HR Plug-in Hybrid | PHEV | 14,0 | 1,2 | 5,95 | 28 | 610 |
| Marke | Modell | Antrieb | Stromverbrauch kWh/100km | Benzinverbrauch L/100km | Kosten CHF/100km (Hausstrom) | CO2 g/km | Reale Reichweite km |
| Audi | Q4 e-tron 40 | BEV | 18,5 | 0 | 5,14 | 0 | 410 |
| Opel | Grandland PHEV 4×4 | PHEV | 12,45 | 1,96 | 6,83 | 46 | — |

¹ Herstellerangabe WLTP, real geschätzt.

## Teil 2

| Marke | Modell | Antrieb | Stromverbrauch kWh/100km | Benzinverbrauch L/100km | Kosten CHF/100km (Hausstrom) | CO2 g/km | Reale Reichweite km |
|---|---|---|---|---|---|---|---|
| VW | ID.7 Pro | BEV | 17,1 | - | 4,75 | 0 | 500 |
| Skoda | Elroq 85 | BEV | 45,0 | 0 | 12,51 | 0 | 520 |
| BMW | iX1 xDrive30 | BEV | 17,8 | 0 | 6,20 | 0 | 400 |
| Mercedes-Benz | CLA 250+ | BEV | 13,9 | 0 | 3,86 | 0 | 620 |
| Hyundai | Inster Long Range | BEV | 14,9 | - | 4,14 | 0 | 330 |
