---
name: BigPoker
description: A frosted glass table for remote-free Planning Poker — physical cards, digital light.
colors:
  ink: "#0f172a"
  ink-soft: "#475569"
  poker-blue: "#2563eb"
  poker-blue-deep: "#1d4ed8"
  aurora-violet: "#7c3aed"
  sand: "#e6ecfb"
  foam: "#f5f7fd"
  surface: "#ffffff"
  surface-strong: "#ffffff"
  line: "#0f172a"
  glint: "#ffffff"
  kicker: "#2563eb"
  canvas: "#eef2fb"
  header: "#fafbff"
  chip: "#ffffff"
  chip-line: "#2563eb"
  danger: "#b91c1c"
  warning: "#b45309"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  kicker:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.69rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.16em"
rounded:
  field: "0.85rem"
  card: "1rem"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  page-max: "430px"
components:
  button-primary:
    backgroundColor: "{colors.poker-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.poker-blue}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.poker-blue-deep}"
    rounded: "{rounded.full}"
    padding: "12px 16px"
  pill:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
  field:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
  playing-card:
    backgroundColor: "{colors.foam}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: BigPoker

## Overview

**Creative North Star: "The Frosted Card Table"**

*(Inferred from the implemented system, not confirmed with the user in an interview — flag anything here you want renamed or redirected.)*

BigPoker replaces a physical Planning Poker deck with a screen everyone in the same room glances at together. The system reads as a table lit from underneath: soft, blurred aurora light (blue and violet radial gradients) washes the whole page, and on top of it sit two kinds of objects. The first is **paper** — the playing cards, form fields, and buttons are opaque, flat, almost printed, because they're standing in for physical objects a hand would pick up. The second is **glass** — the two floating "island" controls (the room-code trigger at the top, the participant bar at the bottom) are true frosted glass: translucent, blurred, floating above the content in a fixed position, borrowing Apple's Dynamic Island language. Nothing else in the system gets that glass treatment; it's reserved for controls that float independent of the document's scroll.

There is exactly one moment of expressive typography: the revealed average, set in Sora instead of the Inter used everywhere else. Every other piece of chrome — labels, buttons, cards — stays in the same restrained sans body face. The palette itself is almost monochrome (ink on white/near-black) with a single confident blue doing all the semantic work (primary actions, focus states, the one ring around a physical card's number), and violet appearing only in the ambient background, never in a control.

**Key Characteristics:**
- Flat, opaque "paper" for anything a user directly manipulates (cards, buttons, fields).
- Translucent "glass" strictly for the two floating island overlays — never blended into content-flow surfaces.
- One accent color (blue) carries every interactive/semantic signal; violet is atmosphere only.
- One expressive font (Sora) reserved for exactly one moment: the revealed number.
- Physical-card literalism: the playing card face deliberately mimics a real Planning Poker card (corner pips, center circle badge, printed watermark), not a generic rounded rectangle.

## Colors

Nearly monochrome (ink/white) with one confident blue accent; violet is atmosphere-only and never appears on a control.

### Primary
- **Poker Blue** (`#2563eb` / dark: `#2563eb`): the one accent. Kicker labels, primary buttons, focus rings, the circle badge on a playing card, the master's ring around their avatar. Used sparingly and consistently — nothing else in the palette signals "interactive" or "selected."
- **Poker Blue Deep** (`#1d4ed8` light / `#93c5fd` dark): links and secondary-button text — a slightly heavier or (in dark mode) lighter step of the same hue, never a different hue.

### Neutral
- **Ink** (`#0f172a` light / `#e2e8f0` dark): all body and heading text.
- **Ink Soft** (`#475569` light / `#94a3b8` dark): secondary/muted text (helper copy, pill labels).
- **Foam** (`#f5f7fd` light / `#0e1730` dark): the playing card's own background — deliberately opaque paper stock, distinct from every translucent "glass" token below.
- **Surface / Surface Strong** (`#ffffff` light / `#0f172a`–`#090e1c` dark): form fields, code chips, buttons' resting background.
- **Canvas** (`#eef2fb` light / `#0a0f1f` dark): the page background's base layer, under the aurora gradients.
- **Line** (`#0f172a` light / `#94a3b8` dark): the one border color, used everywhere via `border-line`.

### Aurora (ambient only)
- **Aurora Violet** (`#7c3aed` light-accent role / `#8b5cf6` dark): appears only in the page's background radial gradients (`body`, `.home-aurora`) and the `selection:` highlight. Never used on a button, card, or piece of UI chrome — its whole job is atmosphere.

### Named Rules
**The One Accent Rule.** Blue is the only color that means "interactive" or "current." Violet never appears on anything the user can click or that carries state.

**The Glass-Is-Local Rule.** Every color token above is a **solid, opaque value** — `src/styles.css`'s `@theme` block is deliberately hex-only, never `rgba()`. When a specific surface needs translucency (see Elevation & Depth), that opacity is applied with Tailwind's `/opacity` modifier directly on the component's className (`bg-header/85`, `border-line/15`), never by editing the shared token. This is a hard, explicitly confirmed project rule, not a stylistic default.

## Typography

**Body/UI Font:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Display Font:** Sora (with the same fallback), weights 700/800 only

**Character:** Inter carries every label, button, heading, and body line in the app — quiet, functional, high-legibility. Sora is held in reserve for exactly one element: the revealed estimate average. That restraint is what makes the reveal feel like an event instead of another heading.

### Hierarchy
- **Display** (Sora, 700, `text-6xl`/`text-7xl` responsive, leading-none): the `AnimatedResultNumber` only — the average shown after a round is revealed. The single expressive typographic moment in the whole system.
- **Heading (lg)** (Inter, 800, `text-2xl`–`text-4xl`): page-level headings (join screen, ended-room screen).
- **Heading (sm)** (Inter, 700, `text-base`–`text-lg`): section headings inside a screen (the current question, "Unirse a sala").
- **Kicker** (Inter, 700, `0.69rem`, `tracking-[0.16em]`, uppercase): the eyebrow label above a value — room code, question, empty states. One component (`Kicker`), used everywhere an eyebrow appears; never hand-rolled inline.
- **Body** (Inter, 400, `text-sm`): helper copy, error text, participant names.

### Named Rules
**The One Display Moment Rule.** Sora appears exactly once per screen, on the revealed number, and nowhere else. Adding a second Sora element dilutes the reveal.

## Layout

Single-column, mobile-first, capped at **430px** (`.page-wrap`) and centered — this is a phone-in-hand tool used during a meeting, not a desktop dashboard. Vertical rhythm is generous but tight within a group: a screen is a stack of `gap-4`/`gap-3` blocks (kicker + heading + body), not a dense grid. The bottom `ParticipantBar` is fixed and content reserves `pb-32` so it never sits underneath it; the top `RoomControlIsland` sits in normal flow with `pt-6` above it, not fixed.

## Elevation & Depth

Hybrid, and the split is deliberate: **flat by default, glass only for floating islands.**

Everything living in the document's normal flow — buttons, form fields, chips, the playing card — is flat: a solid opaque fill and a 1px `border-line`, no shadow, no blur. It reads as paper sitting on the table.

The two "island" overlays — `RoomControlIsland` (top) and `ParticipantBar` (bottom) — are the only true elevation in the system: `shadow-2xl shadow-ink/20` (a real offset+blur shadow, tinted with the ink color rather than pure black) plus `backdrop-blur-xl` over a **locally** translucent background (`bg-header/85`, `border-line/15` — see the Glass-Is-Local Rule above). These are fixed/floating controls independent of scroll, styled after Apple's Dynamic Island: they need to visually separate from whatever content is currently underneath them, which flat surfaces can't do.

### Shadow Vocabulary
- **Island** (`shadow-2xl` + `shadow-ink/20`): the only shadow role in the system. Reserved for the two floating island controls.

### Named Rules
**The Island Exception Rule.** Shadow and backdrop-blur are reserved for the two fixed/floating island controls. A card, button, or field sitting in normal document flow never gets a shadow — if it needs to stand out, that's a border or fill change, not elevation.

## Shapes

- **Full pill** (`rounded-full`, 9999px): buttons, chips/pills, the `ParticipantBar` island shell, participant avatars. The default "interactive control" shape.
- **Card radius** (`rounded-2xl`): the playing card only — large enough to read as a physical card corner, not a chip.
- **Trigger radius** (`rounded-xl`): `RoomControlIsland`'s collapsed trigger — a shorter radius than the full-pill bottom island because it's a static rectangle with a fixed aspect (kicker + code), not a shape that needs to stay circular as it grows.
- **Field radius** (`rounded-[0.85rem]`): text inputs and textareas — between the trigger and the pill, its own tuned value.

### Named Rules
**The Full-Pill Default Rule.** Any new interactive control (button, chip, badge) defaults to `rounded-full` unless it has a documented reason not to (the playing card imitates a physical card; the top island trigger is a fixed-aspect rectangle).

## Components

### Buttons (`Button.tsx`, `buttonVariants` via `cva`)
- **Shape:** full pill (`rounded-full`), `px-4 py-3`, bold `text-sm`.
- **Primary:** solid `bg-blue`, white text, transparent border.
- **Secondary:** transparent fill, `border-blue/55`, `text-blue-deep` — an outline variant, same shape and padding as primary.
- **Danger:** tinted fill (`bg-red-500/10`), `border-red-500/30`, `text-red-800` — the only place a hue other than blue/ink signals state, reserved for destructive actions.
- **Hover / Disabled:** `hover:-translate-y-0.5 hover:brightness-90` (a lift, not a color swap); disabled drops the lift and sets `opacity-55`.

### Chips / Pills (`Pill.tsx`)
- **Style:** `bg-chip`, `border-chip-line`, `text-ink-soft`, `rounded-full`, `text-xs font-bold` — compact status/value display (a cast vote, a checkmark).

### Kicker (`Kicker.tsx`)
- **Style:** `text-kicker` (blue), `0.69rem`, `tracking-[0.16em]`, uppercase, bold. The one eyebrow-label component in the system — every "CÓDIGO DE SALA" / "PRIMERA PREGUNTA" / "Esperando" label goes through this component, never a hand-styled `<p>`.

### Playing Card (`CardFace` in `CardBoard.tsx`) — signature component
The one deliberately literal, physical-object component in the system — it mimics a real Planning Poker card rather than reading as generic app chrome.
- **Background:** `bg-foam` — solid/opaque by necessity: the card sits in an animated `Stack` of overlapping siblings, and any translucency here lets the card behind bleed through (this was a real regression, since fixed).
- **Corners:** top-left and bottom-right each carry the card's value plus a small filled `bg-blue` square (`rounded-xs`), the bottom-right pair rotated 180° — mirrors a real card's opposite-corner pip so the value reads right-side-up from either end of a fanned hand.
- **Center:** the value inside an `h-20 w-20` circle, `border-blue`, `border-2` — the card's focal badge.
- **Background texture:** the BigTech logo tiled at a rotated angle behind the value, `opacity-40`, `grayscale`, `mix-blend-mode: multiply`, wrapped in an `isolate` container so the blend mode can't bleed into sibling cards in the stack (a real bug, since fixed) — reads as a faint printed watermark, not a logo slapped on top.
- **Radius:** `rounded-2xl`, `border-2 border-line`.

### Inputs / Fields (`Field.tsx`)
- **Style:** `bg-surface-strong`, `border-line`, `rounded-[0.85rem]`, `px-3.5 py-2.5`.
- **Focus:** `border-blue-deep` + `ring-2 ring-blue/25` — a soft blue halo, no shadow.

### Island Controls (`RoomControlIsland.tsx`, `ParticipantBar.tsx`) — signature component
The app's only floating, glass-elevated controls, sharing one motion signature (`ISLAND_SPRING`: spring, stiffness 420, damping 34, mass 0.8) for every join/leave/expand/collapse.
- **Shell:** `border-line/15 bg-header/85 shadow-ink/20 shadow-2xl backdrop-blur-xl` — see the Glass-Is-Local Rule; the opacity is a local Tailwind modifier, never a global token edit.
- **Top (`RoomControlIsland`):** `rounded-xl` rectangle, master-only, opens a full-screen modal (room info / participant management tabs). Trailing `IconChevronRight` (tabler, `h-4 w-4`) signals it's tappable — icons in this system always come from `@tabler/icons-react`, never a hand-drawn inline SVG.
- **Bottom (`ParticipantBar`):** `rounded-full` capsule of avatars, expands upward to reveal an overflow list past 5 participants.
- **Hover / Active:** `hover:-translate-y-0.5` + a shadow shift, `active:scale-[0.98]` — a lift-and-press pair, consistent with the Button primitive's own hover lift.

## Do's and Don'ts

### Do:
- **Do** keep every token in `src/styles.css`'s `@theme` block solid hex — no `rgba()`/alpha at the token level.
- **Do** apply translucency locally with Tailwind's `/opacity` modifier (`bg-header/85`) on the specific component that needs glass, scoped to the two island controls.
- **Do** reach for `@tabler/icons-react` for any icon; match the `h-4 w-4` sizing already used across the app.
- **Do** route every eyebrow/label through `Kicker`, never a hand-styled uppercase `<p>`.
- **Do** default new interactive controls to `rounded-full` unless they have a documented reason not to.
- **Do** reuse `ISLAND_SPRING` for any new floating/overlay motion instead of authoring a new easing curve.

### Don't:
- **Don't** add a shadow or `backdrop-blur` to a normal-flow surface (card, button, field) — elevation is reserved for the two fixed island controls.
- **Don't** introduce a second hue as an interactive/semantic signal — blue is the only accent; violet stays in the ambient background.
- **Don't** use Sora anywhere but the revealed-average number.
- **Don't** make the playing card's own background translucent — it sits in an overlapping `Stack` and needs to stay opaque or the card behind it shows through.
