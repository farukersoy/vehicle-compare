PLACE REAL CAR PHOTOS HERE
==========================

To show a real photo instead of the SVG silhouette for any vehicle:

1. Download the car image (JPG or PNG, ideally with transparent or white background)
2. Save it in this folder, e.g.:
     opel-grandland.jpg
3. In src/data/vehicles.ts, add an `image` field to that vehicle:
     image: '/cars/opel-grandland.jpg',

If the image is missing or fails to load, the app automatically
falls back to the SVG silhouette — nothing breaks.

Recommended: ~800x400px, car centered, transparent PNG looks best.

TIP: For a dealership, ask for official press/product images —
those are cleared for commercial use.
