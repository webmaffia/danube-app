# Danube Property Advisor (prototype)

A mobile web app where a virtual Property Advisor profiles a buyer, recommends Danube projects in Dubai, answers unit-level questions, takes a sandbox booking token, runs a simulated KYC and walks through Danube's 1% payment plan. Next.js App Router, Tailwind, Zustand, OpenAI for the agent, HeyGen LiveAvatar for the video avatar.

## Where the data comes from

**Taken from danubeproperties.com**: all 40 projects in the site menu, each from its own project page (fetched October 2026), plus the homepage and the 1% payment plan page.

- **Every project is in the app.** 13 can still be booked: Bayz 102, Shahrukhz Residences, Greenz, Bayz 101, Diamondz, Aspirz, Fashionz, Serenz, the Shahrukhz office tower, Sparklz, Timez, Oceanz 3 and the ready-to-move Eleganz. The other 27 are completed or tagged SOLD OUT on their pages: they show their real facts and no bookable units.
- Per project: area, status, handover, unit count, floors, furnished or not, amenities, nearby places with travel times, the payment plan as the page labels it, starting prices and any per-type prices, and a photo from Danube's site (host these yourself before launch).
- Bayz 102, Shahrukhz Residences and Greenz are hand-built in `lib/inventory.ts` with extra detail. The other 37 are in `lib/projects-data.ts`.
- The 1% plan: around 20% down, 1% of the price a month, the balance when the building is ready. Greenz's FAQ gives 20% down, 40 monthly instalments and 40% on completion.
- Company facts, the logo, favicon and colours.

**Placeholders, labelled "Sample pricing" on screen** (the pages don't publish them):

- Unit sizes (only Greenz publishes them), which of the 24 sample units per bookable project are available, and their floors and views.
- Prices for unit types a page doesn't price, derived at the starting price's rate.
- The AED 20,000 token and the booking and cancellation terms.
- The monthly instalment counts, except Greenz: they are the months to the stated handover, because the pages list a "30/70" plan without terms. The app says they are indicative.
- RERA numbers.

**Conflicts on Danube's own pages** are kept as notes the advisor reads out, for the sales team to settle. Examples: Bayz 102 handover (June 2029 vs December 2028) and starting price, Greenz plan (30/60 vs 20/40/40) and price, Aspirz and Timez starting prices, and several JVC and JVT projects that give two handover dates.

## Run it

```
pnpm install
cp .env.example .env   # OPENAI_API_KEY, HEYGEN_API_KEY, ...
pnpm dev
pnpm test
```

`NEXT_PUBLIC_AVATAR_MODE=svg` runs without the live avatar.

## Layout

- `lib/inventory.ts` and `lib/projects-data.ts`: all 40 projects, and a seeded unit generator for the 13 that can be booked. Towers lay units out floor by floor; Greenz is a community, so its rows are streets. Unit numbers read `BY-1004` (floor 10, flat 04).
- `lib/knowledge.ts`: policies, facts and the objection playbook the agent retrieves. Projects without a hand-written entry get one generated from their page data.
- `lib/agent/`: system prompt, eight strict tools, output guardrails (figures must come from a tool result; no promised returns). Bayz 102 is the featured project and always leads (`FEATURED_PROJECT` in `lib/agent/tools.ts`).
- `lib/journey.ts`: view-to-route mapping, AED formatting, the post-KYC payment schedule.
- `app/`: landing, registration (mock OTP), advisor, recommendations (with the full project list), project, unit map, payment-plan calculator, booking, KYC, payment schedule, presenter console.

## Journey

1. Register (mock OTP). The advisor welcomes you and asks three scripted questions.
2. It recommends projects and opens the screen itself.
3. Ask about units ("the highest floor", "three next to each other"), compare, raise a price objection. Ask about a sold-out project and it says so and offers one you can book.
4. Open the payment-plan calculator, book a unit and pay the sandbox token.
5. Complete KYC (Emirates ID or passport, UAE PASS consent, selfie: all simulated; only a masked document number is kept).
6. Work through the payment schedule: balance of the down payment, sales and purchase agreement, Oqood registration, first 1% instalment.

OTP, payment, KYC, signing and registration are simulated and labelled so. `/console` mirrors the live session.

## Known gaps

- `BUILD.md` is the original land-sales brief and no longer describes this app.
- There is no investment-growth chart: it showed invented percentages, so it was removed. Add one only with figures Danube can source.
- The agent's guardrail treats any figure it didn't get from a tool result as a violation, so new copy that quotes numbers should live in `lib/knowledge.ts` or a tool result.
- Some projects tagged SOLD OUT on the listing still show FAQ starting prices (Breez, Oasiz, Oasiz 2, Viewz). If Danube still sells units there, remove `sold: true` in `lib/projects-data.ts` and the app generates sample units for them.
