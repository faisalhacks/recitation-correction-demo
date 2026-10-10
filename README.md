# Recitation Correction — concept demo

A working demo of one feature: in a group halaqah, a student picks the ayahs
they will recite, the teacher marks mistakes word by word while they recite,
and the student gets a summary when their turn ends.

**Unofficial concept demo. Not affiliated with any organisation.**

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

The demo is built for **two tabs**. Open one as Student and one as Teacher;
they sync through `BroadcastChannel`, so an action in one appears in the other
immediately.

### The click path

1. **Tab 1 → Join as Student.** Pick a surah and an ayah range, choose Sabaq,
   and join. You land in the meeting, waiting your turn.
2. **Tab 2 → Join as Teacher.** Your student is in the participants panel with
   the range they chose. Tap them to start their turn.
3. Tab 1 switches to "reciting now". The teacher's marks are deliberately
   hidden from the student until the turn ends.
4. **Tab 2:** tap words to mark mistakes. Pick a type, add a note, save.
5. **Tab 2 → Finish turn.** Tab 1 opens the summary automatically.
6. **Progress** reflects the saved turns. **Audit log** shows the raw events and
   exports them as JSON.

## How it works

Everything is derived from an **append-only event log** kept in `localStorage`.
Nothing is ever mutated or deleted: removing a mark appends a second event with
`"action": "remove"`, and the current state is folded out of the log on every
render. That is what makes the log usable later as labeled training data.

```
lib/eventLog.ts       event types, persistence, cross-tab sync
lib/state.ts          folds the log into the current state
lib/seed.ts           the starting log (3 waiting students + sample history)
lib/quran.ts          read-only access to the cached Uthmani text
hooks/useSessionState the single interface every screen uses
```

Screens never touch the log directly — they take props or call
`useSessionState()`.

`wordIndex` is **1-based**, matching the source API's `position` field. In
2:3 that makes word 4 وَيُقِيمُونَ, the word carrying the sample mark event in
the brief.

### Checks

```bash
npm test        # folds the log and validates the export
npm run typecheck
npm run lint
npm run build
```

`tests/derive.test.ts` walks a full turn through the real reducer: a student
joins, the teacher starts the turn, marks are added and removed, the range is
narrowed mid-turn, the turn finishes. It asserts the two rules that are easy to
get wrong — a removal *appends* rather than deletes, and marks that fall outside
a narrowed range are kept — plus that the same log always folds to the same
state. `tests/export.test.ts` checks the exported JSON parses and that a mark
event carries every field the brief specifies.

## Quran text

Word-by-word Uthmani text is fetched from the
[Quran.com API v4](https://api.quran.com/api/v4) by `scripts/fetch-quran.mjs`
and cached in `data/quran/`: Al-Fatihah, Al-Baqarah 1–20, and Juz Amma
(78–114) — 591 ayahs, 2,567 words. No Arabic text is typed or generated
anywhere in this repo.

To refresh the cache:

```bash
node scripts/fetch-quran.mjs
```

## What this demo is and isn't

It **is** a working demo of the marking flow, designed to sit on top of an
existing live session, storing corrections as an append-only log that could
later serve as labeled data.

It is **not** automatic mistake detection, real-time AI, or an integration with
any app. There is no audio, no video, and no recording — the meeting screen is
an honest placeholder, and every control either works or says why it can't.

All names are placeholders ("Student A", "Ustadh Demo"). No logos or imagery
from any existing product are used.

## Deploying

Deploys to Vercel with no configuration. All state is client-side, so there is
nothing to provision.
