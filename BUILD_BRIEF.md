# Recitation Correction – Concept Demo: Build Brief

Unofficial concept demo. Not affiliated with any organisation.

## 1. Purpose

A working web demo of ONE feature, to share with the team behind an
existing Quran learning app as a contribution proposal.

The feature: in a group halaqah, a student chooses which ayahs they will
recite before joining. The teacher sees those exact ayahs on their session
screen and marks mistakes word by word while the student recites. The
student gets a summary when their turn ends.

This is a feature demo, not a full product. Everything shown must really
work: state is saved and there are no fake buttons.

Why this feature: the existing app already has a "Reading with
Correction" session type, but its Progress screen is all zeroes. Per-word,
per-category marks from the teacher are the data that would fill it.

## 2. Reference material

Folder `./reference` holds the current product and the proposed feature.
There is no existing code, backend, data model or repo; this build starts
from zero.

> **Not in this repository.** `reference/` is gitignored and kept locally
> only. It contains screenshots of another team's product, including real
> names and their branding, which are not ours to publish. The sections
> below describe that material; nothing in the shipped code depends on it.

### 2a. Six screenshots of the existing app

Android, dark theme, teal/green Islamic-geometric branding.

| Screen | What it shows | Use in this demo |
|---|---|---|
| Home | Welcome banner, "Book admission session" CTA, Live Sessions list, warning "You are currently not part of any group", bottom nav: Home / Groups / Courses / Profile | Recreate the layout; only Home works in the nav |
| Side drawer (2 shots) | Profile header; "Call reciter" active; Quran / Reciters / Study plans / Messages / Progress / Calendar greyed out under "Coming soon" | Recreate; Progress is enabled in the demo |
| Progress | Stat tiles: avg reading time, avg rating 0.0, one-to-one sessions 0, attended sessions 4, tests 0; Plans tiles all 0 | Recreate the tile style, filled with real computed data (section 8) |
| Session details | "Reading with Correction…", ongoing, date, 6:30→10:30 PM, Online, Session 18/78, teacher card, countdown, "Join Now" | Recreate; "Join Now" opens the range picker |
| Join meeting | Blocked by the overlay "Teacher is in prayer break" | Do not recreate the meeting. Reuse the idea as a queue state: "Teacher is on a break" |

### 2b. Two HTML mockups of the proposed screens

Each file is about 2,480 lines of design-system CSS followed by about 100
lines of real markup at the bottom. Read the markup at the end; ignore
the boilerplate CSS above it. Each is a static 366×748 phone frame with no
JavaScript.

- `pre_session_recitation_range_picker.html`: "Before you join". Surah
  dropdown, From/To ayah steppers, Arabic preview, segmented control
  Sabaq / Sabqi / Manzil, footnote that the teacher sees this range on
  joining.
- `teacher_live_correction_screen.html`: timer, student card, range
  chip, marked count, ayah rendered as tappable word spans with
  color-coded underlines, bottom sheet with six mistake types, note
  field, Save mark / Remove.

### 2c. Where the references must NOT be followed

- Voice-note mic button in the bottom sheet: leave it out (no audio in
  this version).
- "3 marked" with only two words highlighted: the count must always be
  derived from the event log.
- Real names of the student and teacher: replace with "Student A" and
  "Ustadh Demo".
- Kaaba photo, logo and pattern images: do not copy. Use a plain CSS
  pattern or flat color in the same palette.
- Arabic text typed into the mockups: do not reuse. Load from the
  verified source (section 11).

## 3. The flow

1. Student taps Join Now, picks surah, ayah range and type, and enters
   the halaqah queue.
2. Teacher sees the queue with each student's chosen range and taps one
   to start their turn.
3. Teacher's screen shows those ayahs. Teacher taps words to mark
   mistakes while the student recites.
4. Either side can change the range; the other screen updates instantly.
5. Teacher taps "Finish turn". The student's summary opens automatically.
   Teacher returns to the queue.
6. Progress updates from the saved marks.

## 4. Decisions already made

| Topic | Decision |
|---|---|
| Session type | Group halaqah with a queue; one student recites at a time |
| Range control | Student and teacher can both change it during a turn |
| Mark visibility | Student sees marks only after the turn ends |
| Audio/video | None, still — but the meeting is now drawn in full rather than stood in for. See §19. |
| Audio recording | None in this version |
| AI detection | None. The demo only produces the labeled data |
| Backend | None. localStorage plus BroadcastChannel between tabs |

## 5. Stack

- Next.js (App Router) + TypeScript + Tailwind.
- Persist in localStorage.
- Sync between browser tabs with BroadcastChannel, so a Student tab and a
  Teacher tab on one computer update each other instantly.
- Must deploy to Vercel without extra configuration.

## 6. Look and layout

- Mobile-first, inside a centered phone frame (~390px wide) on desktop;
  full width on real phones; works down to 360px.
- Dark theme with green accents, matching the screenshots and mockups
  (colors, corner radii, card style).
- Arabic in the Amiri font, right to left.

## 7. Demo controls (outside the phone frame)

- Role switcher: Student / Teacher.
- "Open other role in new tab" link.
- "Reset demo data" button.
- Visible label: "Concept demo – not affiliated with any organisation".

## 8. Student screens

1. **Home**: recreated from the screenshot (greeting, live session card,
   bottom nav). Only Home and Progress work; other items show
   "Coming soon".
2. **Session details**: recreated from the screenshot, with "Join Now".
3. **Range picker** (from mockup): surah dropdown, From/To ayah steppers
   validated against real ayah counts, live Arabic preview, type selector
   (Sabaq = new lesson, Sabqi = recent, Manzil = old revision),
   "Join session".
4. **Waiting in queue**: position in the queue and the chosen range,
   which can still be edited. Shows "Teacher is on a break" when the
   teacher sets that state.
5. **Reciting**: the selected ayahs and a "reciting now" state. The
   teacher's marks are NOT shown during recitation.
6. **Summary**: opens automatically on "Finish turn". Every marked word
   in the context of its ayah, mistake type, teacher's note, totals by
   type.
7. **Progress**: same tile style as the screenshot, computed from real
   saved sessions: sessions attended, ayahs recited, mistakes per session
   over time, most common mistake type.

## 9. Teacher screens

8. **Queue**: students with their chosen range and type, and a status of
   waiting / reciting / done. Seed 3 demo students in addition to the
   live Student tab. Tap a student to start their turn. A "Take a break"
   toggle.
9. **Live correction** (from mockup): the reciting student's ayahs word
   by word. Tap a word to open a bottom sheet: mistake type (Tajwid,
   Makhraj, Harakah, Missed, Extra, Hesitation), optional text note,
   Save or Remove. Marked words get a color-coded underline; legend
   below; the "marked" count is always accurate. Buttons: "Change range"
   and "Finish turn".
10. **Audit log**: the raw event list for the session, plus an "Export
    labeled data" button that downloads it as JSON.

## 10. Session rules

- Only one student recites at a time; the teacher chooses who is next.
- Range changes sync instantly and are logged as events. Marks outside a
  new range are kept, never deleted.
- Both live screens sit inside the meeting itself, not a strip. See §19.

## 11. Data rules

**Quran text**

- Do NOT type or generate any Arabic Quran text.
- Load Uthmani text word by word from a verified source (Quran.com API
  v4 or Tanzil data).
- Save it in the repo as JSON for Al-Fatihah, Al-Baqarah 1–20 and
  Juz Amma.
- Credit the source in the footer.

**Event log**

All teacher actions are an append-only log. A mark event:

```json
{
  "id": "evt_001",
  "sessionId": "sess_01",
  "studentId": "student_a",
  "surah": 2,
  "ayah": 3,
  "wordIndex": 4,
  "type": "tajwid",
  "note": "",
  "teacherId": "ustadh_demo",
  "timestamp": "2026-10-10T10:20:00Z",
  "action": "add"
}
```

- Removing a mark appends an event with `"action": "remove"`; nothing is
  ever deleted.
- Range changes, break on/off and turn start/finish are also events.
- Current state is always derived from the log.

**Names and assets**

- Placeholder names only ("Student A", "Ustadh Demo").
- Do not copy real names, logos or photos from the references.

## 12. Code structure and file ownership

| File / folder | Owner | Contents |
|---|---|---|
| `lib/eventLog.ts` | Main session only | Event types, append, persistence, BroadcastChannel sync |
| `lib/state.ts` | Main session only | Deriving current state from the log |
| `hooks/useSessionState.ts` | Main session only | The single hook screens use to read and write data |
| `data/quran/*.json` | `quran-data` agent | Cached Quran text and ayah counts |
| `components/`, `app/` screens | `screen-builder` agent | UI only |

Rules:

- Screen components never import `eventLog.ts` or `state.ts` directly.
  They accept props or call `useSessionState()`.
- The main session writes and freezes the hook's interface BEFORE any
  screen work is delegated.
- If a screen needs something the hook does not offer, the agent reports
  it back; the main session extends the hook.

## 13. How to work (for Claude Code)

- Use the frontend-design skill for all UI work.
- Create three subagents in `.claude/agents/`:

| Agent | Model | Effort | Job |
|---|---|---|---|
| `quran-data` | haiku | low | Fetch, cache and validate the Quran JSON |
| `screen-builder` | sonnet | medium | Build one screen at a time from `./reference` |
| `qa-checker` | haiku | low | Run build and lint, report failures only |

- Set each subagent's effort if the frontmatter supports it.
- When creating the `screen-builder` agent, explicitly instruct it not to
  modify `state.ts`, `eventLog.ts` or `useSessionState.ts` (the core sync
  logic written by the main session). All screen components accept props
  or use `useSessionState()` to read and write data, preventing merge
  conflicts.
- Order of work:
  1. Main session (Opus): plan, then wait for my approval.
  2. Main session: event log, state derivation, sync, and the hook.
  3. `quran-data`: cache and validate the text (can run alongside step 2).
  4. `screen-builder`: screens in parallel where they don't share files.
  5. `qa-checker`: build and lint after each batch of screens.
  6. Main session: final review against section 15, then give me a short
     click path to demo the full flow in two tabs.

## 14. Setup before starting (done by me, once)

```
/plugin marketplace add anthropics/claude-code
/plugin install frontend-design@claude-code-plugins
/model opus
```

Check `/plugin` to confirm the skill is enabled. If the install name
fails, pick frontend-design from the official Anthropic list in `/plugin`.

## 15. Manual test before sharing

- [ ] Student picks a range; it appears in the teacher's queue.
- [ ] Teacher starts the turn; student tab switches to "reciting now".
- [ ] Marks save, show the right color, and the count is correct.
- [ ] Removing a mark adds a "remove" event in the audit log.
- [ ] Range change on either tab appears on the other.
- [ ] "Finish turn" opens the summary on the student tab.
- [ ] Progress numbers match the saved sessions.
- [ ] Export downloads valid JSON.
- [ ] Arabic text matches the source for the cached surahs.
- [ ] No real names, logos or photos anywhere.
- [ ] No mic or recording button anywhere.
- [ ] Works on a phone at 360px width.

## 16. What I can honestly claim when sharing

- Accurate: "a working demo of the marking flow, designed to sit on top
  of your existing live sessions."
- Accurate: "corrections are stored as an append-only log that can later
  serve as labeled data."
- Not accurate: "automatic mistake detection", "real-time AI", or
  "integrated with your app". None of these exist in this demo.

## 17. External references

- Quran.com API v4 (word-by-word Uthmani text): https://api.quran.com/api/v4
- Tanzil (verified Quran text downloads): https://tanzil.net
- Claude Code subagents documentation: https://code.claude.com/docs/en/sub-agents

## 18. Overrides (take priority over sections 7–9)

- Entry point is a landing page: large "Recitation Correction Demo"
  heading, one line of explanation, two big buttons: "Join as Student"
  and "Join as Teacher". No role switcher bar. Keep "Reset demo data"
  and the "Concept demo" label in the footer.
- Do not build Home, side drawer or Session details in this version.
  Keep Progress and Summary.
- Student path: landing → range picker → meeting screen.
- Teacher path: landing → meeting screen.
- Meeting screen (both roles): Zoom-style layout with participant tiles
  (avatar, name, mic icon), a call timer and a bottom control bar. No
  real audio or video. Label: "Simulated meeting".
- Seed the meeting with "Ustadh Demo" and 3 demo students, each with a
  preset sabaq, so it looks alive from either role.
- Teacher's meeting has a Participants panel listing each student with
  surah, ayah range and type. Tapping a student opens the live
  correction view over the meeting.

## 19. Amendment: the meeting is now drawn, not stood in for

Supersedes §4 "Audio/video", the §2a note "Do not recreate the meeting", and
the call-strip rule in §10.

**What changed.** Screenshots arrived of the client the halaqah actually meets
in — a Jitsi Meet Android build, used in Arabic. The slim placeholder strip was
replaced with a faithful clone of that client, in Arabic and right to left:
prejoin, tile grid, speaker stage with filmstrip, overflow sheet, chat, and
participant stats. The whole app moved to `lang="ar" dir="rtl"` at the same
time; the halaqah is conducted in Arabic and the interface now is too.

**What did not change.** There is still no audio, no video, no camera and no
recording. Nothing was added that captures media.

**The two layers stay visibly separate.** The meeting chrome uses its own
`--color-jitsi-*` palette — the client's near-black and blue — and shares no
token with the green correction UI above it. This is deliberate. The feature
being proposed would sit on top of someone else's meeting, and a single blended
product would be the wrong picture to hand anyone.

**Cloned controls still obey §12's "no decorative buttons".** The clone is
complete, because dropping rows would misrepresent the client, but a control
with nothing to act on in a demo is visibly disabled and says why: car mode,
low-bandwidth mode, breakout rooms, and audio output all carry a reason.
The controls that are real are real — your own microphone, chat, the view
toggle, minimise, participants, and leave.

**Names.** The screenshots show real people in a real circle. Their names are
no more ours to ship than the other team's were (§2c), so the demo keeps
placeholder identities: الأستاذ (تجريبي) and الطالب أ/ب/ج/د.

**New event kinds**, all additive, all folded by `lib/state.ts` like the rest:

| Kind | Carries | Note |
|---|---|---|
| `chat` | `from`, `fromName`, `text` | The sender's name rides on the event, so the transcript survives them leaving |
| `mic` | `who`, `muted` | A toggle, a handful per session — safe to log |
| `leave` | `studentId` | Drops the tile, keeps the turns and the floor time |

**Floor time is derived, never stored.** Speaking time folds out of turn
boundaries; the turn in progress is added in the component. A running counter
would have to be written back every second, and every write stringifies the
whole log and broadcasts it to every open tab. `tests/meeting.test.ts` pins
this down — those checks fail if a stored counter is ever reintroduced.
