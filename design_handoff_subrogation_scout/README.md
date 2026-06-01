# Handoff: Subrogation Opportunity Scout

## Overview

An AI-assisted claim review tool for insurance subrogation investigators at **Pursuant Indemnity Mutual**. An AI model (Claude) analyzes incoming claims for subrogation opportunity, scores each with a confidence value, and recommends an action. A human reviewer then confirms, rejects, defers, or requests more information. Every action is recorded to a tamper-evident audit log.

The tool has four views: a **Queue** of flagged claims, a **Claim Detail** three-pane reviewer workspace, an **Audit Log**, and an **Error States** reference screen.

---

## About the Design Files

The files in this bundle are **high-fidelity design references built in React/JSX**. They are prototypes showing the intended look, layout, and behavior — not production code to ship directly. The task is to **recreate these designs in the target codebase's existing environment** using its established patterns, component libraries, and conventions. If no environment exists, React is the natural choice given the prototype.

All logic in the prototype is front-end only (mock data, simulated API latency). A real implementation will need:
- A backend API for claim data, model inference, and audit persistence
- Authentication / session management
- Real document storage and retrieval

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, interaction states, and copy are final. Implement pixel-accurately using the design tokens below.

---

## Design Tokens

### Typography
| Role | Family | Size | Weight |
|---|---|---|---|
| UI default | Inter | 14px | 400 |
| Product name | Inter | 15px | 600 |
| Section labels / meta | Inter | 10–11px | 600, uppercase, letter-spacing 0.06–0.08em |
| Body / thesis text | Inter | 13–14px | 400 |
| Claim ID / timestamps / confidence scores | JetBrains Mono | 11–13px | 400–500 |
| Document body text | Georgia, "Times New Roman", serif | 15px | 400, line-height 1.7 |
| Large metric values | Inter | 22–28px | 700 |

### Colors
| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#FAFAF9` | Page / app background |
| `bg-white` | `#fff` | Cards, panels, topbar |
| `bg-subtle` | `#F9FAFB` | Alternate row, reviewer panel bg |
| `bg-muted` | `#F3F4F6` | Active nav pill, avatar bg |
| `text-primary` | `#1F2937` | Primary text |
| `text-secondary` | `#374151` | Secondary text, body |
| `text-tertiary` | `#6B7280` | Meta, captions |
| `text-muted` | `#9CA3AF` | Placeholder, dim labels |
| `border-default` | `#E5E7EB` | Most borders |
| `border-subtle` | `#F3F4F6` | Column dividers within cards |
| `green-600` | `#047857` | HIGH tier dark, confirm action |
| `green-500` | `#10B981` | HIGH tier circle |
| `green-100` | `#D1FAE5` | HIGH tier bg |
| `amber-600` | `#B45309` | MEDIUM tier dark, warning text |
| `amber-400` | `#F59E0B` | MEDIUM tier circle |
| `amber-100` | `#FEF3C7` | MEDIUM tier bg, evidence highlight |
| `red-700` | `#B91C1C` | LOW tier dark, reject, SOL urgent |
| `red-500` | `#EF4444` | LOW tier circle |
| `red-100` | `#FEE2E2` | LOW tier bg, error bg |
| `orange-200` | `#FED7AA` | Contradicting evidence bg |
| `orange-400` | `#FCA57A` | Contradicting evidence border |
| `yellow-300` | `#FDE68A` | Active evidence highlight |
| `blue-100` | `#EFF6FF` | Model-run event pill bg |
| `blue-700` | `#1D4ED8` | Model-run event pill text |

### Confidence Tier Config
```
HIGH:   circle #10B981  · bg #D1FAE5  · dark text #047857
MEDIUM: circle #F59E0B  · bg #FEF3C7  · dark text #B45309
LOW:    circle #EF4444  · bg #FEE2E2  · dark text #B91C1C
```

### Action Config
```
ROUTE_TO_DEMAND:  label "ROUTE TO DEMAND LETTER"  · text #047857 · bg #D1FAE5 · border #6EE7B7
GATHER_MORE_INFO: label "GATHER MORE INFO"         · text #B45309 · bg #FEF3C7 · border #FCD34D
REJECT:           label "REJECT"                   · text #B91C1C · bg #FEE2E2 · border #FCA5A5
DEFER:            label "DEFER"                    · text #6B7280 · bg #F3F4F6 · border #D1D5DB
```

### Spacing / Shape
| Token | Value |
|---|---|
| Topbar height | 56px |
| Breadcrumb bar height | 48px |
| Card border-radius | 8px |
| Panel border-radius | 7–10px |
| Button border-radius | 4–6px |
| Card gap (queue list) | 6px |
| Section gap (detail pane) | 20px |
| Standard padding (content area) | 24px |
| Scrollbar width | 6px, `#E5E7EB` thumb |

---

## Screens / Views

### 1 — Top Bar (global, all pages)

**Layout:** `56px` tall, `#fff` background, `1px solid #E5E7EB` bottom border. Three zones in a `flex` row with `space-between`:

**Left zone:** Product name "Subrogation Opportunity Scout" (`15px`, `600`, `#1F2937`) + carrier block stacked below it: "PURSUANT INDEMNITY MUTUAL" (`11px`, `600`, `#374151`, uppercase, tracking 0.02em) / "Reliable, where applicable." (`10px`, `#9CA3AF`, italic).

**Center zone:** Nav pill group (`gap: 4px`). Three buttons — Queue, Audit Log, Error States.
- Active state: `background #F3F4F6`, `color #111827`, `font-weight 600`, `border-radius 4px`, `padding 5px 12px`
- Inactive: transparent bg, `color #6B7280`, `font-weight 400`

**Right zone:** Today's date in JetBrains Mono (`12px`, `#6B7280`) + reviewer identity chip:
- Container: `background #F9FAFB`, `border 1px solid #E5E7EB`, `border-radius 6px`, `padding 4px 10px`, flex row `gap 7px`
- Avatar: `20×20px` circle, `#E5E7EB` bg, initials `10px 600 #374151`
- Name: `12px #374151` / Role: `11px #9CA3AF`

---

### 2 — Queue Page (`/queue`)

**Layout:** Full-height scroll container, `background #FAFAF9`. Inner content max-width `1200px`, centered, `padding 24px 24px 40px`.

#### Metric Tiles Row
Three tiles in a `flex` row, `gap 12px`, `margin-bottom 20px`.

Each tile: `background #fff`, `border 1px solid #E5E7EB`, `border-radius 8px`, `padding 16px 20px`, `min-width 180px`.
- Value: `28px`, `700`, color from accent prop (or `#1F2937`)
- Label: `11px`, `#6B7280`, uppercase, tracking 0.06em, `margin-top 4px`

Tiles: "Flagged in queue" (neutral) · "HIGH confidence" (accent `#047857`) · "SOL within 30 days" (accent `#B91C1C`)

#### Filter / Action Bar
`flex` row, `align-items center`, `gap 10px`, `margin-bottom 16px`.

- **Confidence filter:** Label "Confidence" (`11px #9CA3AF` uppercase) + three toggle buttons (HIGH / MEDIUM / LOW). Active: tier's `bg` + `dark` color border/text. Inactive: `#fff` bg, `#E5E7EB` border, `#6B7280` text. `padding 4px 9px`, `border-radius 4px`, `font-size 11px 600`.
- **Vertical divider:** `1px × 20px #E5E7EB`
- **Sort select:** Label "Sort" + native `<select>` with options: SOL urgency / Confidence (high→low) / Recovery amount. `font-size 12px`, `border 1px solid #E5E7EB`, `border-radius 4px`, `padding 4px 8px`.
- **Spacer** (`flex: 1`)
- **"+ Drop a new claim" button:** `background #1F2937`, `color #fff`, `border-radius 6px`, `padding 8px 16px`, `font-size 13px 500`. "+" icon `font-size 16px`, inline in flex row.

#### Column Header Row
`font-size 10px 700 #9CA3AF` uppercase, tracking 0.07em. `border-bottom 1px solid #E5E7EB`, `margin-bottom 8px`, `padding 6px 0`.
Columns (same widths as claim cards):
- Conf. — 80px, centered
- Claim / LOB — 210px, left
- Recovery — 150px, right-aligned
- SOL — 160px, left
- Thesis / Action — flex 1, left
- (chevron) — 56px

#### Claim Card Row
`min-height 76px`, `border-radius 8px`, `overflow hidden`, `cursor pointer`.

States:
- Default: `background #fff`, `border 1px solid #E5E7EB`
- Hover: `background #F9FAFB`, `border 1px solid #D1D5DB`
- New (2.4s): `background #FFFBEB`, `border 1px solid #FCD34D`
- Actioned (confirmed/rejected): `opacity 0.72`, `background #FAFAFA`

Columns separated by `1px #F3F4F6` vertical dividers (`align-self: stretch`):

**Confidence column (80px):** `ConfidenceCircle` — `48×48px` circle in tier color, confidence score `13px 700 #fff` JetBrains Mono, tier label `10px 600` tier dark color underneath.

**Identity column (210px), `padding 14px 16px`:**
- Claim ID: `13px` JetBrains Mono, `#1F2937` (actioned: `#9CA3AF`, strikethrough)
- LOB: `11px #6B7280` uppercase tracking 0.05em
- Age: `11px #9CA3AF`
- If actioned: status badge `10px 600` green/red, "✓ Confirmed" / "✗ Rejected"

**Recovery column (150px), `padding 14px 16px`, right-aligned:**
- Amount: `22px 700 #1F2937` (actioned: `#9CA3AF`)
- Label: `10px #9CA3AF` uppercase "Est. recovery"

**SOL column (160px), `padding 14px 16px`:**
- Date: `12px #6B7280` JetBrains Mono, "SOL: YYYY-MM-DD"
- Days: if urgent → `14px 700 #B91C1C` "⏱ EXPIRES IN N DAYS"; else → `13px #6B7280` "expires in N days"

**Thesis column (flex 1), `padding 14px 16px`:**
- Thesis text: `14px #374151`, 2-line clamp, `line-height 1.45`
- Action pill below: see Action Config. `font-size 10px`, `padding 2px 6px` (small variant)

**Chevron column (56px):** `›` `font-size 16px #9CA3AF` (actioned: `#D1D5DB`), centered.

#### Error Claim Card
Same outer shell but `background #FFFCFC`, `border 1px solid #FCA5A5`.
- Left column: `48×48px` circle `#FEE2E2` bg + `2px solid #FCA5A5` border, "!" `18px #EF4444`, "ERROR" label `10px 600 #B91C1C` below.
- Dividers: `#FEE2E2`
- Error type label: `12px 600 #B91C1C` uppercase
- Error message: `13px #6B7280`
- Actions column (130px): "Resubmit" (`#FEE2E2` bg, `#B91C1C` text) + "Manual review" (`#F9FAFB` bg, `#6B7280` text). Full-width, `border-radius 4px`.

#### Drop a Claim Modal
Backdrop: `rgba(17,24,39,0.45)`, full-viewport, click-outside to close.
Dialog: `background #fff`, `border-radius 10px`, `width 500px`, `box-shadow 0 20px 40px rgba(0,0,0,0.16)`.
- Header: `padding 24px 24px 0`. Title `17px 600 #111827`, subtitle `12px #9CA3AF`.
- Options: `padding 20px 24px`, `gap 10px`. Three radio cards with label + description. Selected: `border 1.5px solid #6B7280`, `background #F9FAFB`. Unselected: `border 1.5px solid #E5E7EB`, `#fff`. `border-radius 7px`, `padding 12px 14px`.
- Footer: `border-top 1px solid #F3F4F6`, `padding 16px 24px`, flex end. Cancel button (idle only) + Run button.
  - Run idle: `background #1F2937 #fff`. Running/done: `background #9CA3AF`.
  - While running: left-aligned "Analyzing claim…" text `13px #6B7280`.

---

### 3 — Claim Detail Page (`/claim/:id`)

#### Breadcrumb Bar
`height 48px`, `background #fff`, `border-bottom 1px solid #E5E7EB`, `padding 0 24px`.
- Back button: `border 1px solid #D1D5DB`, `border-radius 5px`, `padding 5px 12px`, `font-size 13px 500`. Hover: `#F3F4F6` bg, `#9CA3AF` border.
- Separator: `color #D1D5DB`
- Claim ID: `13px` JetBrains Mono `#1F2937 500`
- Meta: `12px #9CA3AF` — LOB · age
- Right: status badge (if actioned) — `font-size 12px 600`, `padding 3px 10px`, `border-radius 4px`. Confirmed: `#D1FAE5 / #047857`. Rejected: `#FEE2E2 / #B91C1C`.

#### Three-Pane Layout
Height: `calc(100vh - 56px - 48px)`. All three panes are fixed-height scroll containers.

**Left pane — Source Documents (40% width)**
`border-right 1px solid #E5E7EB`

Tab strip: `background #F9FAFB`, `border-bottom 1px solid #E5E7EB`. Per-tab: `padding 10px 16px`, active tab `border-bottom 2px solid #1F2937`, `font-weight 600 #111827`; inactive `border-bottom 2px solid transparent`, `#6B7280`.

Document body: `padding 24px 28px`. Font: Georgia serif, `15px`, `line-height 1.7`, `color #1F2937`.

Evidence inline highlight spans:
- Supporting (ev): `background #FEF3C7` → active `#FDE68A`, active `box-shadow 0 0 0 2px #F59E0B`. Badge circle = numbered ①②③…
- Contradicting (cv): `background #FED7AA` → active `#FDBA74`, active `box-shadow 0 0 0 2px #F97316`. Badge circle = ⚠.
- Click toggles active state.

"Show all evidence" toggle: `font-size 12px #6B7280`, underlined, below document body. Expanded list: amber/orange cards, `border-radius 6px`, `padding 10px 12px`.

**Middle pane — AI Assessment (35% width)**
`border-right 1px solid #E5E7EB`, `padding 24px 20px 32px`, `gap 20px` flex column.

- **Confidence Chip:** `inline-flex`, `background` tier bg, `border 1px solid {tier.color}40`, `border-radius 8px`, `padding 10px 16px`. Circle `40×40px` tier color, score `14px 700 #fff` JetBrains Mono. Right: tier name `13px 700` dark color uppercase tracking 0.06em, "AI assessment" `11px` dark color at 0.8 opacity.

- **AI Assessment block:** Label `11px 600 #9CA3AF` uppercase. Thesis text `17px #111827 400`, `line-height 1.55`.

- **Third Party block:** `background #F9FAFB` (identified) / `#FFFBEB` (unidentified), `border 1px solid #E5E7EB` / `#FCD34D`, `border-radius 7px`, `padding 12px 14px`. If unidentified: "OPEN QUESTION" badge `10px 600 #B45309` on `#FEF3C7`. Row layout: label `11px #9CA3AF` 50px fixed width, value `12px #374151` (unidentified: `#9CA3AF` italic).

- **Recovery + SOL row:** Two equal-width tiles, `gap 12px`. Recovery: `background #F9FAFB`, `border 1px solid #E5E7EB`, `border-radius 7px`. Amount `26px 700 #111827`. SOL: urgent = `#FEF2F2 / #FCA5A5`, normal = `#F9FAFB / #E5E7EB`. State + date in JetBrains Mono `13px #374151`.

- **Supporting Evidence list:** Label + items in flex column `gap 6px`. Each item clickable (`cursor pointer`): `padding 10px 12px`, `border-radius 6px`. Active: `#FFFDE8` bg, `#FCD34D` border. Inactive: `#FFFEF5` bg, `#F3F4F6` border. Source label `10px 600 #9CA3AF` uppercase. Quote `13px italic #374151`, 3-line clamp. Claim `12px #6B7280`.

- **Contradicting Evidence list:** Same structure but active `#FFF0E5 / #FCA57A`, inactive `#FFFAF5 / #F3F4F6`. Section header has ⚠ icon, `color #92400E`.

- **Reviewer Warnings:** `background #FFFBEB`, `border 1px solid #FCD34D`, `border-radius 7px`. List items `13px #78350F`, `line-height 1.5`.

- **Open Questions:** Bulleted list `13px #374151`.

- **Recommended Action:** `ActionPill` at full size — `font-size 11px`, `padding 3px 8px`.

**Right pane — Reviewer Actions (flex 1, ~25%)**
`background #FAFAF9`, `padding 20px 18px 32px`, `gap 16px` flex column.

- **Success banner** (post-action): green (`#F0FDF4 / #86EFAC`) or red (`#FEF2F2 / #FCA5A5`). Status text `12px 600`, time + reviewer name `11px #6B7280`. "Change decision" button `11px #6B7280`, `#fff` bg, `border 1px solid #D1D5DB`, `border-radius 4px`.

- **Reviewer identity card:** `#fff`, `border 1px solid #E5E7EB`, `border-radius 7px`, `padding 12px 14px`. Avatar `34×34px` circle `#E5E7EB`, initials `12px 600 #374151`. Name `13px 500 #1F2937`, role `11px #9CA3AF`. Dropdown select below to switch reviewer. Disabled when action taken.

- **Notes textarea:** Label `11px 600 #9CA3AF` uppercase. Textarea `min-height 80px`, `border 1px solid #E5E7EB`, `border-radius 6px`, `padding 10px 12px`, `font-size 13px`. Disabled (bg `#F9FAFB`) when action taken.

- **Action buttons** (flex column `gap 8px`):
  1. "Confirm & Route to Demand Letter" — `#047857` bg + `#fff` text (idle), `#D1FAE5` bg + `#047857` text (post-action). `font-weight 600`.
  2. "Gather More Info" — `#fff` bg, `#B45309`, `border #FCD34D`.
  3. "Reject" — `#fff` bg, `#B91C1C`, `border #FCA5A5`.
  4. "Defer for Senior Review" — `#fff` bg, `#6B7280`, `border #D1D5DB`.
  All: `width 100%`, `padding 10px 14px`, `border-radius 6px`, `font-size 13px`. Non-taken actions fade to `opacity 0.45` post-action. `cursor not-allowed` when disabled.

- **Per-claim audit trail:** `border-top 1px solid #E5E7EB`, `padding-top 16px`. Entries newest-first. Timestamp JetBrains Mono `11px #9CA3AF` + type pill (claim_received: `#F3F4F6/#6B7280`; model_run/reviewer_action: `#EFF6FF/#1D4ED8`). Detail text `12px #374151`.

---

### 4 — Audit Log Page (`/audit`)

**Layout:** scroll container, max-width `1400px`, `padding 28px 28px 48px`.

**Header row:** H1 `22px 700 #111827` + "Export JSON" + "Export CSV" buttons (right-aligned). `border 1px solid #E5E7EB`, `border-radius 5px`, `padding 7px 14px`, `font-size 12px 500`.

**Filter row:**
- Text input `width 240px` for claim ID filter
- Event type toggles: Claim received / Model run / Reviewer action. Same toggle pattern as queue filters but use event type colors.
- "Clear" button (when filters active)
- Entry count `12px #9CA3AF` right-aligned

**Table:** `border 1px solid #E5E7EB`, `border-radius 8px`, `overflow hidden`. `border-collapse collapse`.

Header row: `background #F9FAFB`, `border-bottom 1px solid #E5E7EB`. Th: `padding 9px 14px`, `font-size 10px 700 #9CA3AF` uppercase tracking 0.07em.

Columns: Timestamp (UTC) 195px · Claim ID 165px · Event 150px · Model version 130px · Reviewer 140px · Action/Decision auto · Confidence 100px · Notes 200px.

Body rows: alternating `#fff` / `#FAFAFA`. `border-bottom 1px solid #F3F4F6`. `padding 10px 14px` per cell. Timestamps + claim IDs + model versions: JetBrains Mono. Missing values: `—` in `#D1D5DB`. Confidence: `13px 700 #1F2937` JetBrains Mono. Event type: colored pill (same colors as action buttons). Notes: 2-line clamp.

Export behavior: download `audit-log.json` or `audit-log.csv` of currently filtered rows.

---

### 5 — Error States Page (`/errors`)

Reference page showing 5 error patterns. `max-width 900px`.

1. **Service Unavailable (HTTP 503):** Full-page centered state with gray circle ⚠ icon, heading, description, "Try again" + "Contact support" buttons. Dimmed faux topbar above. Status code in JetBrains Mono footer.

2. **Session Expired:** Blurred queue (CSS `blur(3px)`) behind a centered modal. `360px` wide, "Sign in again" full-width button. "Your queue position and notes are saved" reassurance below.

3. **Model Run Timeout:** Amber warning banner at top of queue view with retry-all action. Stalled claim row with dashed `48×48px` circle placeholder (`border 2px dashed #D1D5DB`), "…" text, and "Retry" button. Timeout meta below.

4. **Document Unavailable (in-pane):** Tab strip with "Police Report" active showing empty state — gray `40×40px` square icon (⛔), heading, description, "Retry fetch" + "Upload manually" actions.

5. **Permission Denied:** Centered full-page state, red circle ✕ icon (`#FEE2E2` bg), heading, explanation with monospace claim ID, "← Back to Queue" + "Request access" buttons.

---

## Interactions & Behavior

### Queue
- **Sorting:** Controlled by select; sorts displayed array on every render. Options: SOL urgency (asc), confidence (desc), recovery (desc). Error claims always sort to natural position.
- **Tier filtering:** Multi-select toggle buttons; empty selection = show all.
- **Claim card click:** Navigate to claim detail.
- **New claim highlight:** On add, the card flashes `#FFFBEB` bg + `#FCD34D` border for 2.4 seconds, then fades.
- **Drop a Claim modal:** Select a scenario → "Run analysis" → 3.8s simulated latency → claim inserted at top of queue → modal closes.

### Claim Detail
- **Evidence cross-linking:** Clicking an evidence item in the assessment pane scrolls to and highlights the corresponding span in the document pane (switching document tabs as needed). Clicking the span in the document also activates the evidence item. Click again to deactivate.
- **Reviewer action:** Selecting any of the four action buttons captures reviewer name + notes, updates claim status, appends to audit trail, and shows success banner. All buttons except the taken one fade to 0.45 opacity. Notes + reviewer dropdown become disabled.
- **Change decision (undo):** Reverts claim to `pending`, appends a reversal entry to audit trail, re-enables action UI.
- **Back button:** Returns to queue, preserving queue scroll position and filter state.

### Audit Log
- **Filtering:** Real-time; filters apply on every keystroke / toggle click.
- **Export:** Filtered rows only. JSON uses `JSON.stringify(rows, null, 2)`. CSV has a fixed header row.

---

## State Management

| State | Scope | Description |
|---|---|---|
| `page` | App | Active view: `'queue'` \| `'detail'` \| `'audit'` \| `'errors'` |
| `selectedId` | App | Claim ID of the open detail view, or `null` |
| `claims` | App | Array of all claim objects; mutated by reviewer actions and new-claim adds |
| `auditLog` | App | Flat array of all audit events, newest first; grows on every reviewer action |
| `activeDoc` | ClaimDetail | Which document tab is open |
| `activeEvId` | ClaimDetail | ID of the highlighted evidence item (`null` = none) |
| `actionTaken` | ClaimDetail | Decision string for the current claim session, or `null` |
| `filterTier` | QueuePage | Array of active tier filters |
| `sortBy` | QueuePage | Active sort key |
| `showModal` | QueuePage | Drop-a-claim modal visibility |

---

## Data Model

### Claim object (key fields)
```
id            string        "CLM-2026-00481"
confidence    number|null   0.92
tier          string        "HIGH" | "MEDIUM" | "LOW" | "ERROR"
lob           string        Line of business
fnolRelative  string        Human-readable age ("6 days ago")
recovery      number|null   Estimated dollar recovery
recoveryBasis string        Basis for estimate
solDate       string        "YYYY-MM-DD"
solDays       number|null   Days until SOL
solUrgent     boolean       True if solDays ≤ 30
solState      string        State abbreviation
thesis        string|null   AI assessment narrative
action        string|null   Recommended action key
status        string        "pending" | "confirmed" | "rejected" | "deferred" | "error"
thirdParty    object        { name, type, carrier, identified }
evidence      array         [{ id, docKey, source, quote, claim }]
contradicting array         [{ id (prefixed "C"), docKey, source, quote, claim }]
warnings      string[]      Reviewer warnings
openQuestions string[]
docs          object        { [docKey]: { parts: Part[] } }
auditTrail    object[]      Per-claim history entries
errorMessage  string?       (error status only)
errorType     string?
```

### Doc Part types
```
{ t: 'text', v: string }               Plain text
{ t: 'ev',   id: number, v: string }   Supporting evidence span
{ t: 'cv',   id: string, v: string }   Contradicting evidence span (id prefixed "C")
```

### Audit log row
```
ts            string     "YYYY-MM-DD HH:MM UTC"
claimId       string
type          string     "claim_received" | "model_run" | "reviewer_action"
modelVersion  string     e.g. "claude-opus-4" or ""
reviewer      string
action        string     Human-readable action/decision
confidence    number|null
notes         string
```

---

## Assets

- **Fonts:** Inter (400/500/600/700, italic 400) + JetBrains Mono (400/500) — both loaded from Google Fonts.
- **Icons:** None — all indicators use Unicode characters (›, ⚠, ✓, ✕, ①②③…, ⛔, ⏱) and emoji-free text badges.
- **Images:** None.
- **Brand assets:** None beyond the product name and carrier name in the topbar.

---

## Files

| File | Description |
|---|---|
| `Prototype.html` | Entry point — loads React/Babel, mounts `<App>`, wires all pages |
| `components.jsx` | Shared UI atoms: `TopBar`, `MetricTile`, `ConfidenceCircle`, `ConfidenceChip`, `ActionPill`, `SOLCountdown`, `EvBadge` |
| `Queue.jsx` | Queue page: `QueuePage`, `ClaimCard`, `ErrorClaimCard`, `DropClaimModal` |
| `ClaimDetail.jsx` | Detail page: `ClaimDetailPage`, `DocumentPane`, `AssessmentPane`, `ActionsPane` |
| `AuditLog.jsx` | Audit log page: `AuditLogPage` |
| `ErrorStates.jsx` | Error states reference page: `ErrorStatesPage` + 5 sub-components |
| `data.js` | Mock data: `CLAIMS`, `AUDIT_LOG_INIT`, `NEW_CLAIM_TEMPLATES`, `TIER_CONFIG`, `ACTION_CONFIG` |

Open `Prototype.html` directly in a browser to run the prototype locally (no build step needed).
