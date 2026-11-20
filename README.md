# EV Compare — Swiss Real-World Vehicle Cost Calculator

Compare BEV, PHEV, and HEV vehicles by real-world energy cost and CO₂ per 100 km.
Based on a Gemini query of owner-reported consumption and real owner measurements.

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel** (deployment)

---

## Quick start

### 1. Create the Next.js project

```bash
npx create-next-app@latest vehicle-compare \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd vehicle-compare
```

### 2. Replace / add the source files

Copy the files from this repo into the project directory, overwriting the defaults:

```
tailwind.config.ts          ← replace
src/app/globals.css         ← replace
src/app/layout.tsx          ← replace
src/app/page.tsx            ← replace

src/types/index.ts          ← new
src/data/vehicles.ts        ← new
src/lib/calculations.ts     ← new

src/components/VehicleSilhouette.tsx   ← new
src/components/VehicleCard.tsx         ← new
src/components/SettingsBar.tsx         ← new
src/components/ComparisonDelta.tsx     ← new
src/components/VehicleGrid.tsx         ← new
```

You can delete the default `src/app/page.tsx` content — it gets replaced.

### 3. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Vercel

```bash
git init
git add .
git commit -m "initial commit"
gh repo create vehicle-compare --public --source=. --remote=origin --push
# Then: https://vercel.com/new → import the repo
```

---

## Data

- **30 vehicles** across BEV, PHEV, HEV categories
- **10+ brands**: Opel, VW, Toyota, Hyundai, Kia, BMW, Tesla, Mercedes, Audi, Volvo, Dacia, Peugeot, Mini, Honda, Lucid
- Data quality flag: `measured` (owner data) vs `estimated`
- Reference vehicle: **Opel Grandland PHEV 4×4** — owner's real 22,849 km measurements

## Settings

| Setting | Default | Notes |
|---------|---------|-------|
| Charge rate (compared vehicle only) | Home | CHF 0.278 / kWh (owner's billed average; ElCom median 2026: 0.277) |
| Public charge | — | CHF 0.59 / kWh (TCS median DC fast charging) |
| Petrol | CHF 1.718 / L | Editable; owner's actual average |
| Petrol CO₂ | 2'780 g/L | — |
| CO₂ grid factor | 50 g/kWh | Adjustable slider |

The reference Opel is always calculated with home charging.
| PHEV scenario | Full battery | Toggle: full ↔ empty |

---

## Project structure

```
src/
  app/
    page.tsx            Main page + state management
    layout.tsx          Root layout, fonts (Space Grotesk, Inter, JetBrains Mono)
    globals.css         Tailwind base
  data/
    vehicles.ts         Full dataset (30 vehicles)
  lib/
    calculations.ts     Cost & CO₂ formulas, annual projections
  types/
    index.ts            TypeScript interfaces
  components/
    VehicleSilhouette.tsx   SVG car shapes per body type
    VehicleCard.tsx         Large card + thumbnail card
    SettingsBar.tsx         Sticky settings strip
    ComparisonDelta.tsx     VS panel with cost/CO₂ delta
    VehicleGrid.tsx         Filterable vehicle selector grid
```

---

## Roadmap ideas

- [ ] Add more vehicles (Skoda, Renault, Mazda, Ford)
- [ ] Annual km input (default: 15,000)
- [ ] Export comparison as PDF / image
- [ ] Electricity tariff presets (Swiss cantons)
- [ ] Mobile: bottom sheet for vehicle selection
