# plotter web shop

Clickable prototype of the plotter web shop, built for the M241/M245 user tests and the "Höhle der Löwen" pitch. Customers write a note, and a machine writes it on paper with a real pen. Nothing is ordered, sent or charged.

**Live:** https://bastiankind.github.io/plotter-web-shop/

Every push to `master` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). The repo's Pages source has to be set to **GitHub Actions** once in Settings → Pages.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## What you can click through

- **One note:** choose the paper (A4, A5, business card), write and arrange the note, check out, see the confirmation.
- **Bulk order:** pick "Sending to many", upload a recipient list (Excel `.xlsx` or CSV) or use the example list, write one message with `{first_name}`, and check every personal card before checkout.
- **Editor:** drag and resize text and icons on the paper, add text boxes, icons or your own SVG, undo/redo (Ctrl+Z / Ctrl+Y), zoom, alignment, handwriting style, ink colour and a full-size preview.
- **Pop-ups:** help/FAQ, preview, "start a fresh design?" confirmation, tooltips, toasts.

Prices are in CHF and based on the cost calculation in [PRICING.md](PRICING.md) (paper, ink, power, machine wear, handling and margin). Card fields at checkout show fixed demo values and can't be edited.

For bulk orders, small lists can be typed straight into the table (or pasted from Excel); uploading an `.xlsx` or `.csv` file is meant for long lists.

## Stack

React 18, TypeScript and Vite. No UI library: styles live in `src/styles`, colours come from the plotter logo (`tokens.css`).

```
src/
  pages/        one file per step (ChoosePaper, Recipients, Design, Checkout, ThankYou)
  components/   paper rendering, editor, dropdown, modal, tooltip, toast, header
  state/shop.tsx  all order state in one reducer, including undo/redo
  lib/          pricing, dates, CSV/Excel import, placeholder handling, drag maths
  data/         paper formats, handwriting styles, starter designs, example recipients
```

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build to `dist/`
- `npm run typecheck`: type-check only
