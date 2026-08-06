# yogabhishek — portfolio

A scroll-driven 3D coastline. The camera is strung along nine stops over the
water; scrolling moves it, and an overlay card fades in at each stop. Built in
the spirit of [kairui.dev](https://kairui.dev) — same idea, own scene and code.

## Files

| file | what it is |
| --- | --- |
| `index.html` | markup, all CSS, and the complete no-WebGL fallback page |
| `scene.js` | the Three.js world, the camera path, and the scroll binding |
| `Yogabhishek_Sukuluri_Resume.pdf` | linked from the RÉSUMÉ button and the finale |

No build step. No bundler. Three.js comes from a CDN via an import map.

## Run it locally

```sh
python3 -m http.server 4321
# then open http://localhost:4321
```

It must be served over http — ES modules don't load from `file://`.

## Deploy

It's a static site, so any host works. For Vercel:

```sh
npx vercel --prod
```

## Editing the content

Everything that appears on screen lives in two places:

- **`scene.js` → `STOPS`** — the nine camera stops. Each has a `pos` (where the
  camera sits), a `look` (what it aims at), the `chapter` it belongs to, and for
  the work/project stops the `card` HTML and `kicker` line. Adding a stop is a
  matter of adding an entry; the scroll length, the dot nav and the day/night
  ramp all size themselves off `STOPS.length`.
- **`index.html` → `#ui`** — the hero, about and skills chapters, which are
  static markup, plus `#fallback`, which is the whole résumé as a plain page.

`scene.js` → `TOD` is the palette, one entry per stop, ramping from morning
through sunset to night. The `night` value in each drives the window lights,
the lighthouse beam, the stars and the exposure.

## Accessibility

The 3D scene is skipped entirely — and `#fallback` shown instead — when WebGL
is unavailable or the visitor has `prefers-reduced-motion: reduce` set. The
fallback carries the full résumé text, so nothing is only available in 3D.
