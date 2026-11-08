# Inter City Service & Travel — website

Static marketing site for **Inter City Service & Travel Sdn Bhd** (ICS Travel), a corporate
and leisure travel agency in Kuala Lumpur, Malaysia.

**Live:** https://www.myintercity.com

Hand-built with [Astro](https://astro.build). No UI framework, no runtime, no database,
no booking engine — every page is pre-rendered to plain HTML at build time, and the contact
form posts to a form service. It replaces the company's earlier Webflow-hosted site; the design,
copy and page set were carried over and re-implemented as hand-written Astro components.

---

## Pages

| Route | Source | What it is |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Hero, three service cards, certifications band, service detail, call to action, team grid |
| `/contact/` | `src/pages/contact.astro` | Enquiry form plus phone, WhatsApp, email and office details |
| `/noraini/` | `src/pages/noraini.astro` | Managing Director profile |
| `/zakaria/` | `src/pages/zakaria.astro` | Marketing Director profile |
| `/norman/` | `src/pages/norman.astro` | Sales & IT Manager profile |
| `/thank-you/` | `src/pages/thank-you.astro` | Post-submission confirmation (`noindex`) |
| `404.html` | `src/pages/404.astro` | Not-found page (`noindex`) |

The three profile pages are thin wrappers around `src/components/TeamProfile.astro` and differ
only in the data and copy they pass in.

## Stack

- **Astro 7** with `output: "static"` — no framework JavaScript ships; the only JS is three small inline scripts (animation gating, animation triggering, form redirect)
- **TypeScript** in `.astro` frontmatter, checked with `astro check`
- **One hand-written stylesheet**, `src/styles/global.css` (~2,100 lines) — no Tailwind, no CSS
  framework, no preprocessor
- **`astro:assets`** `<Image>` for every image (webp output, explicit width ladders)
- **`@fontsource/source-sans-pro`** self-hosted latin subsets: 200 / 300 / 400 / 600 / 700 / 700 italic

## Requirements

Node **>= 22.23.4** and npm **>= 9.6.5** (Astro 7's own `engines` floor).

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server on http://localhost:4321 |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run check` | `astro check` — type and template diagnostics |

No environment variables are required — see [Contact form](#contact-form).

## Project structure

```
src/
  assets/images/        26 source images — 25 .webp + mcc-logo.svg, nothing unused
  components/           Navbar.astro, Footer.astro, TeamProfile.astro
  layouts/
    BaseLayout.astro    <head>, SEO + JSON-LD, fonts, navbar/footer shell
  pages/                7 pages (file = route)
  styles/
    global.css          all styling (~2,100 lines, single source of truth)
  env.d.ts              Astro client types
public/                 favicons, site.webmanifest, og-image.jpg,
                        robots.txt, sitemap.xml, llms.txt, llms-full.txt
scripts/
  make-og.mjs           regenerates public/og-image.jpg
astro.config.mjs        site URL, static output, CSS inlining
```

## How it is put together

### Images

- Sources live in `src/assets/images/` and are already-optimised webp. Astro re-encodes each one
  per `<Image>` (`format="webp"`, with `quality` tuned per slot from 55 for backgroundish artwork
  up to 92 for the navbar logo) and emits hashed files into `dist/_astro/`.
- **Never add a raw `<img>`.** Importing through `<Image>` is what produces the responsive
  `srcset`, the intrinsic `width`/`height` (no layout shift) and the immutable cache filenames.
- `widths` are picked per slot against that slot's `sizes`. Rule of thumb: with `sizes="100vw"`
  a 1280px window only gets a light file if a `1280w` candidate exists — an 800/1200/1600 ladder
  silently falls back to 1600 on ordinary laptops. That is why the hero and the two sub-page
  headers use `[800, 1000, 1280, 1600]`.
- One CSS background remains, in the home-page call to action (`.cta__scrim` →
  `card2-small.webp`, 117 KB). Everything else is a DOM image.

### Animations

Reveals are CSS-only and attribute-driven: `data-anim="fade-up" | "fade" | "zoom"` for
load-in and `data-anim-scroll="slide" | "shift"` for scroll-triggered ones, with delay and
out-duration set per element through `--anim-delay` / `--anim-out`. They are gated twice —
the `html.js` class is only added when `IntersectionObserver` exists, and the rules sit inside
`prefers-reduced-motion: no-preference` — so content is never invisible without JavaScript and
never animates for users who asked it not to.

### Contact form

- Plain HTML POST to `https://silentforms.com/api/submit`; submitting needs no JavaScript.
- `silentFormsKey` in `contact.astro` is a **public form token** — it can only deliver to the
  inbox it was issued for. It is committed deliberately: a static build would inline it into the
  HTML even if it came from an environment variable.
- The hidden `redirect` field points at `https://www.myintercity.com/thank-you/`. SilentForms
  requires an *absolute* URL and rejects the whole submission otherwise, so a small script swaps
  in `location.origin` when the origin differs (dev server, preview, staging). It is a no-op in
  production because the rendered value already matches.
- `sf_extra` is an off-screen honeypot; leave it alone.
- Gotcha: if "Allowed domains" is ever switched on for the key in the SilentForms dashboard,
  submissions from `localhost` are rejected with `403` — that check reads the request's `Origin`
  header, not the redirect target.

### Styling

One stylesheet. Breakpoints are max-width 991 / 767 / 479, plus a 480–767 range and a min-width
768 block. A "Desktop fold" block at the end of `global.css` makes the hero and intro claim
exactly the first screen at ≥768px, so the certifications band arrives on scroll. Changing hero
copy, intro-card padding or that block's numbers moves the fold — re-check at 1280×900.

### SEO and discovery

- `BaseLayout.astro` props: `title`, `description`, `ogTitle`, `ogDescription`, `ogType`,
  `image`, `imageAlt`, `noindex`, `schema`.
- Every page emits one JSON-LD `@graph`: `TravelAgency` + `WebSite` always, plus per-page nodes
  (`Person`, `ProfilePage`, `BreadcrumbList`, `ContactPage`) passed in via `schema`.
- Canonical URLs are derived from `site` in `astro.config.mjs` plus the pathname, so changing
  the domain is a one-line edit.
- `public/sitemap.xml` is **hand-written on purpose** (`@astrojs/sitemap` is not installed):
  add new pages to it by hand when you create them.
- `public/robots.txt` allows everything, lists the sitemap and names the AI/answer-engine
  crawlers explicitly. `public/llms.txt` + `llms-full.txt` describe the business for LLM clients
  in the [llmstxt.org](https://llmstxt.org) format — update them when services or contact
  details change.
- `public/og-image.jpg` is a pre-rendered 1200×630 card; regenerate it with
  `node scripts/make-og.mjs` if the tagline or logo changes.

## Recipes

**Change copy** — pages are ordinary HTML inside `.astro` files; edit and rebuild.

**Add a page** — create `src/pages/name.astro` using `<BaseLayout title=… description=…>`, then
add the URL to `public/sitemap.xml` (and `public/llms.txt` if it is worth describing). Add it to
`Navbar.astro` / `Footer.astro` only if it belongs in the global navigation.

**Replace an image** — drop the optimised `.webp` into `src/assets/images/`, update the import,
and pick `widths` that match the slot's `sizes` (see above). Delete the old file: nothing in
`src/assets/images/` is allowed to be unreferenced.

**Add a team member** — add an entry to the array in `index.astro`, create the page wrapper
(`noraini.astro`, `norman.astro` and `zakaria.astro` are ~10 lines each, all `TeamProfile`),
and add the URL to the sitemap.

**Change the domain or the share card** — `site` in `astro.config.mjs`; the card via
`node scripts/make-og.mjs`.

**Before pushing** — `npm run check && npm run build`.

## Performance and accessibility

Measured on the production build with a cold cache, desktop 1280×900 and phone 390×844
(DPR 3, 4× CPU throttle, slow 4G) — Lab numbers, not field data, so treat them as regression
baselines rather than promises:

| Metric | Value |
| --- | --- |
| Built site | 93 files, 5.97 MB total in `dist/` |
| Home page, desktop | 854 KB / 22 requests for the initial view; 1.08 MB full page |
| Home page, phone | 818 KB full page (every lazy image included) |
| LCP, phone (throttled) | ~4.0 s |
| CLS | 0 on phone, 0.008 on desktop (font swap) |

Accessibility work that is easy to undo by accident: tap targets are at least 44 px (some use
`padding-block` with an equal negative `margin-block` so the box stays put and only the hit area
grows), form inputs are 16 px so iOS does not zoom on focus, focus styles are visible, images that
carry meaning have descriptive `alt` text and purely decorative ones are marked `alt=""`. Run
`npm run check` after markup changes — it flags missing `alt` attributes and ARIA mistakes.

## Deployment

`npm run build` produces a fully static `dist/` — upload its **contents** to any static host or
plain web server. There is no Node runtime, no serverless function and no database in production.

- `dist/404.html` is the custom not-found page; configure the host to serve it for 404s.
- Pages are built as directories with trailing slashes (`/contact/index.html`, `/contact/`), and
  links throughout the site use that form. Keep the trailing slash when linking, or set up
  redirects.
- Worth setting at the host, if it is not already default: Brotli or gzip for text responses,
  `cache-control: public, max-age=31536000, immutable` for `/_astro/*` (filenames are
  content-hashed), HTTP/2, and a short cache on `index.html`.
- The only server-side dependency is the contact form's delivery, which is handled by
  SilentForms — nothing to configure on the host.

## Browser support

Evergreen Chrome, Edge, Firefox and Safari. The layout relies on CSS grid/flexbox, `clamp()`,
`aspect-ratio` and `100svh`; the reveal animations are additive, so browsers without
`IntersectionObserver` get a fully readable page with no animation.

## Conventions

- Two-space indent, double quotes, `.astro` frontmatter first, one stylesheet.
- Class names are BEM-ish (`.certs`, `.certs__grid`, `.team-card__photo`).
- Comments explain *why* something is odd rather than what the line does — for example the
  mobile hero deliberately keeps the export's 130 px padding band and the cards' 127 px pull-up,
  which reads like a bug until you know the overlap is intended.

## Ownership

Site code and content © Inter City Service & Travel Sdn Bhd. Company registration 145913-M,
KKKP licence 0554. This is a company website, not a template — please do not reuse the wording,
photography or branding.

**Inter City Service & Travel Sdn Bhd**
Unit 1J, First Floor, Holiday Place Kuala Lumpur, 225 Jalan Ampang, 50450 Kuala Lumpur, Malaysia
+603 2935 8108 (24-hour line) · info@myintercity.com

