# How plotter's prices are calculated

Prices per piece = material + electricity + machine wear + handling, then roughly doubled so that about half of the price is margin. All amounts in CHF, rounded. These are prototype assumptions, not quotes from suppliers.

## Costs per piece

| | Business card | A5 | A4 |
|---|---|---|---|
| Paper, 300 g/m² ivory (≈ 0.40 per A4 sheet) | 0.05 | 0.20 | 0.40 |
| Ink (refill ≈ 3.00 for ≈ 600 m of line) | 0.01 | 0.02 | 0.05 |
| Electricity (≈ 30 W, 27.7 Rp./kWh) | 0.00 | 0.00 | 0.00 |
| Machine wear and maintenance (≈ 0.02 per writing minute) | 0.02 | 0.06 | 0.16 |
| **Material and machine** | **0.08** | **0.28** | **0.61** |
| Handling: load, check, pack (CHF 24/h) | 0.20 | 0.40 | 0.60 |
| **Total cost** | **0.28** | **0.68** | **1.21** |
| **Price** | **0.80** | **1.50** | **2.50** |
| Margin | 0.52 (65 %) | 0.82 (55 %) | 1.29 (52 %) |

Even with 20 % volume discount (from 250 pieces), an A5 note still leaves CHF 0.52.

## Assumptions

- **Paper:** budget 300 g/m² A4 card costs about €0.16 per sheet (Folia, 50 sheets for about €8), premium paper like Gmund about €2.40 per sheet. We assume a good ivory card at **CHF 0.40 per A4 sheet**. A5 is half a sheet; ten business cards fit on one sheet, plus cutting waste.
- **Ink:** gel and ballpoint refills are rated for about 450–800 m of line (0.5–0.7 mm). We assume CHF 3.00 for 600 m, and about 1 m of line for a business card, 4 m for A5 and 10 m for A4.
- **Electricity:** two stepper motors, an ESP32 and a servo draw about 30 W while writing. An A4 note takes about 8 minutes, so 4 Wh, or about 0.1 Rappen at the 2026 Swiss median of 27.7 Rp./kWh. Electricity is negligible.
- **Machine wear:** about CHF 200 for the machine over two years, plus about CHF 50 a year for spare parts (belts, servo, pen holders), spread over about 15,000 writing minutes (5,000 A5 notes at 3 minutes). That's about CHF 0.02 per writing minute. Writing times: 1 minute for a business card, 3 for A5, 8 for A4.
- **Handling:** someone loads the paper, checks the result and packs it: 30 seconds for a business card, 1 minute for A5, 1.5 minutes for A4, at CHF 24 an hour.

## Extras and delivery

| | Price | Reasoning |
|---|---|---|
| Envelope | 0.50 | Quality ivory envelopes cost about 0.20–0.25 each; white C5 envelopes cost about 0.10 in 100-packs. |
| Standard delivery, or postage per card in bulk orders | 1.50 | A-Post stamp CHF 1.20 in 2026, CHF 1.40 from January 2027, plus addressing and packing. |
| Your own handwriting | + 0.50 per piece | Covers turning the customer's template into a handwriting style. A one-time fee would be fairer once this is real. |
| A-Post Plus, one parcel for bulk orders | 6.00, 9.00 | Placeholders, not checked against Swiss Post's tariffs. |
| Many copies (same design, delivered to you) | 1.50 up to 10 pieces, then 9.00 | Up to 10 pieces fit in a letter; more go as one parcel. |

## Examples

- **One A5 note with envelope, sent by A-Post:** 1.50 + 0.50 + 1.50 = **CHF 3.50** (before: 6.50).
- **30 A5 notes, each posted to its recipient:** 30 × 1.35 (−10 % volume price) + 30 × 0.50 envelopes + 30 × 1.50 postage = **CHF 100.50**, or CHF 3.35 per card all-in (before: 184.50).

- **100 business cards, same design, delivered to you:** 100 × 0.70 (−15 % volume price) + 9.00 parcel = **CHF 79.00**.

For comparison, US services such as Handwrytten charge about USD 3.25–3.75 per card plus postage.

## Sources

- Paper: [Gmund Original Vergé 300 g/m² A4](https://world-en.gmund.com/gmund-original-verge-beige-300-g-m2-a4/ogver-07-300-21-29-7), [Folia Fotokarton A4 300 g/m², 50 sheets](https://www.ebay.de/p/1104181937)
- Envelopes: [Mettler Office C5, 100 pieces (Digitec)](https://www.digitec.ch/en/s1/product/mettler-office-couvert-c5-100x-envelopes-5607271), [ELCO Premium C5/6, 500 pieces (Alltron)](https://alltron.ch/de/product/82251)
- Ink: [PBS refill ratings (writing length)](https://katalog.pbspolska.eu/en/writing-and-correction-products/gel-pens/gel-pen-refill-penac-fx7-0-7mm-black-18653.html)
- Electricity: [ElCom newsletter 09/2025](https://www.elcom.admin.ch/dam/de/sd-web/znXqHISH0pFP/Newsletter_09-2025_D.pdf)
- Postage: [Swiss Post letter prices from 2027 (iamexpat)](https://www.iamexpat.ch/expat-info/swiss-news/swiss-post-letter-price-2027), [2026 increase blocked (swissinfo)](https://www.swissinfo.ch/eng/workplace/swiss-post-may-not-increase-prices-for-2026-as-planned/89796372)
- Comparison: [Handwrytten on the HubSpot marketplace](https://ecosystem.hubspot.com/de/marketplace/listing/handwrytten)
