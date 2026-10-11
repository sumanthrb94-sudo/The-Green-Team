# Map strategy — vs PlotsView, and where /map goes next

## What PlotsView does (from their live Agartha listing, Oct 2026)

| Feature | PlotsView | Us today |
|---|---|---|
| Region view | Satellite basemap, every venture as a pin coloured green→red (looks like distance or price from the core), ORR ring drawn | Satellite / topo / vector basemaps, 3 sanctuary pins, ORR + RRR with all exits, forests, AQI glow |
| Venture view | Zooming in replaces the pin with the **site layout drawn on the satellite image**: every plot is a polygon, green = available, dark = sold, plot numbers on top, amenity area as a rendered image | The layout was only a flat image on the property page (`LayoutPlan`), separate from the map |
| Toggle | "Hide layout" pill | — (added in this change) |
| Selection | Bottom card: photo, ₹/sq yd, locality, category chip, Get in touch | Inspector card with AQI, noise, forest radius, link to the page |
| Property page | Stats row (plots, extent, size range, available), brochure, loan calculator, About / Location / Amenities tabs, distance from "Detect me" or a custom destination | Richer content (gallery, specs, invest panel, reviews) but no live distance-from-me |
| Lead gate | Logged-out visitors get a few layout views ("2 attempts left") before login | Unit price gated behind sign-in; layout itself is public |

Their availability numbers for Agartha (37 plots, 24 available) match our plot count, and their layout shows plots 3, 7, 8, 10, 11, 14, 22, 28, 29, 34, 35, 36 and 37 as sold. **Confirm against the developer's sales sheet before entering any status** — never copy a competitor's sold markings.

## What this change adds

- `lib/data/site-layouts.ts` — a georeferenced layout per sanctuary: overlay image, three corner anchors (lat/lng of the drawing's TL, TR, BL), per-plot status, and helpers to project plot dots onto the ground.
- `components/map/SiteLayoutLayer.tsx` — a Leaflet layer that warps the master-plan line drawing onto the basemap with a CSS affine matrix (handles scale, rotation and skew; follows zoom animation), plus one tappable circle per plot coloured by status, with plot numbers from zoom 17.
- `/map` — at zoom ≥ 15 the layout replaces the pin, with a Hide/Show layout pill and a status legend. Tapping a plot opens a plot card (size, price behind sign-in, WhatsApp enquiry). Choosing Agartha flies straight onto its layout.
- `public/layouts/agartha-overlay.webp` — our own master plan (ARQEN A001) with the white background, title block and compass removed.
- **Calibration mode** — `/map?calibrate=agartha` shows drag handles (✥ moves the whole drawing; TL / TR / BL reshape it) and prints the anchors to paste back into `site-layouts.ts`.

### Before this goes live: calibrate Agartha

The current anchors are an **estimate** centred on our map pin (17.74, 78.28, which is itself only to 2 decimals), and the map says "position approximate" until `calibrated: true`. PlotsView puts the venture at Mohammadabad; get the real site location from the developer (survey sketch, Google Maps pin of the gate, or a KML), open calibration mode, and line the drawn boundary up with the access road and the curving road on the east side visible in the imagery. Three well-spread points are enough.

## Roadmap to a cleaner, faster map than theirs

1. **Real plot polygons instead of circles.** Trace each plot once in QGIS or geojson.io over the calibrated overlay and store a GeoJSON `FeatureCollection` per venture (`properties: { plot, area, status }`). Render with `L.geoJSON` on a shared `L.canvas()` renderer — crisp at every zoom, a few KB, and the fill colour *is* the status (what PlotsView shows). The overlay image then becomes optional.
2. **Status from Firestore, not code.** Move `status` into the sanctuary document (admin Properties manager already edits per-type parameters) so sales update the map without a deploy, and the "Available" count on the page comes from the same data.
3. **Slim the region view.** `SanctuaryMap.tsx` is ~1,600 lines and draws every ORR/RRR exit as a DOM `divIcon`. Render exits as canvas `circleMarker`s and only show labels above zoom 12; split HUD, inspector and layers drawer into their own components; lazy-load the layout layer only when a venture is zoomed.
4. **Price/zone colouring on pins**, like their green→red, but meaningful and explained in a legend (e.g. ₹/sq yd band or drive time to the Financial District), and cluster pins below zoom 10 once there are more than ~20 ventures.
5. **Bottom-sheet pattern on mobile.** One draggable sheet (peek → half → full) for venture and plot details instead of separate floating cards, with the URL updated (`/map?v=agartha&plot=24`) so a plot can be shared on WhatsApp.
6. **Distance from me / custom destination** on the property Location tab — the browser Geolocation API plus a routing API (OSRM public demo for prototypes; a hosted router for production) to give km and drive time.
7. **Vector basemap later.** If we outgrow raster tiles, MapLibre GL with a PMTiles file on our CDN gives smooth zoom, 3D tilt and our own styling with no per-view API cost. The layout GeoJSON from step 1 carries over unchanged.
8. **Lead capture parity.** Keep the layout public (it sells) but gate per-plot price and the brochure behind sign-in, as now — that's friendlier than an "attempts left" counter.
