# Oliver Michael Spielmann - Personal Website

Static personal website for **Oliver Michael Spielmann** (Chairman, Founder, Angel Investor and Board Member). Built as a single-page profile in the Spielmann Consulting AG corporate design (Navy / Gold / Open Sans), bilingual German + English, deploy-ready for GitHub Pages or Cloudflare Pages.

The signature element is a **scroll-built Swiss train**: as you scroll through the chapters, a seven-wagon train (Pub car, Speisewagen, Strategischer Einkauf, Segafredo, Boutique M&A, Black Coffee Group, Locomotive) assembles wagon by wagon and rolls from the rear to the front of the stage. Each wagon is one chapter of Oliver's career.

## Files

- `index.html` - all content, fully bilingual via `data-de` / `data-en` attributes
- `styles.css` - design tokens, layout, train stage and wagons, responsive, `prefers-reduced-motion`
- `script.js` - scroll-driven train animation, bilingual toggle, counters, reveal observer, sticky header
- `favicon.svg` - navy + gold train icon
- `og-image.svg` - LinkedIn-shareable preview
- `site.webmanifest` - PWA metadata
- `_headers` - Cloudflare Pages security and cache headers
- `404.html` - branded not-found page
- `README.md` - this file

No build step. No external runtime dependency apart from Google Fonts (Open Sans).

## Local preview

From this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Cloudflare Pages

Use these settings:

```text
Framework preset: None
Build command: empty
Build output directory: .
Root directory: this folder
```

The `_headers` file is included for security headers and conservative cache rules. There is no SPA routing, so no `_redirects` file is needed.

After the production domain is known, update the canonical URL and absolute social-preview URLs in `index.html`:

```html
<link rel="canonical" href="https://your-domain.example/">
<meta property="og:url" content="https://your-domain.example/">
<meta property="og:image" content="https://your-domain.example/og-image.svg">
```

## GitHub Pages

After pushing to GitHub, enable Pages in the repository settings:

1. Go to Settings > Pages.
2. Set Source to `Deploy from a branch`.
3. Select `main` and `/ (root)`.
4. Save.

The page publishes from the repository root.

## Bilingual toggle

The `DE | EN` toggle in the navigation swaps every element with `data-de` and `data-en` attributes. The active language is persisted in `localStorage` under `oms-lang` so the choice survives reloads.

## Accessibility

- Skip link for keyboard users
- `prefers-reduced-motion` short-circuits the train animation and reveals
- Visible focus rings via `outline: 2px solid var(--gold)`
- Semantic landmarks (`header`, `main`, `footer`, `nav`, `section`, `article`)
- ARIA labels on the navigation, language toggle, and stamp

## Editing content

All chapters and timeline entries live in `index.html`. Each text element has matching `data-de` and `data-en` attributes. To update copy:

1. Edit the German text inside the element.
2. Update the matching `data-de` attribute to the same string (it is what the toggle resets to).
3. Update the `data-en` attribute with the English translation.

Dashes follow the workspace rule: ASCII hyphen `-` only, no em or en dashes anywhere.
