---
name: Devicons
description: Open-source developer icons and logos, filed on one optical grid.
colors:
  signal-orange: "#ff4d00"
  signal-orange-hot: "#ff6b2b"
  signal-orange-tint: "#ffd9c2"
  ink-black: "#000000"
  drawer-black: "#0a0a0a"
  hairline: "#1a1a1a"
  text-primary: "#e6e6e6"
  text-secondary: "#b5b5b5"
  text-muted: "#8a8a8a"
  string-tan: "#c9a876"
  status-green: "#00c951"
  status-red: "#ff4d4d"
  paper-white: "#ffffff"
  paper-surface: "#f5f5f5"
  paper-hairline: "#d4d4d4"
  paper-text: "#171717"
  signal-orange-paper: "#b33300"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "clamp(3rem, 10vw, 8rem)"
    fontWeight: 900
    lineHeight: 0.85
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.signal-orange-hot}"
  input-search:
    backgroundColor: "{colors.drawer-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "12px 48px"
  chip:
    backgroundColor: "{colors.drawer-black}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  tab-item-active:
    textColor: "{colors.signal-orange}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  icon-cell:
    backgroundColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    height: "144px"
---

# Design System: Devicons

## Overview

**Creative North Star: "The Specimen Drawer"**

Devicons is shown like a type foundry's specimen cabinet. Every mark is filed on the same grid, labelled in mono, and set into a black drawer that has no colour of its own. The logos are the only saturated things on the page, and the interface is the frame and the index card around them. One hot orange signal marks where you are and what is selected.

The world is brutalist in construction: no rounded corners anywhere, 1px hairline rules for structure, and tonal layering instead of shadows. Controls are hard-edged but tactile: they answer a press with solid fills and inverted active states, not lifts or glows. The density is that of a catalogue. Collapsed borders tile cells into one continuous grid, and uppercase mono captions carry the metadata.

**Key Characteristics:**
- No border radius on any element, anywhere (a global `border-radius: 0`).
- Black drawer surfaces. Colour comes from the logos, with a single Signal Orange accent.
- Two voices: a geometric grotesque for names and headings, a mono for labels, code and data.
- 1px hairlines and tonal steps do all the structural work. There are no drop shadows.
- Dark is the default; a full light ("paper") theme mirrors every token.

## Colors

The interface is a near-monochrome frame with one signal colour, so the logos stay the loudest thing on screen.

### Primary
- **Signal Orange** (`signal-orange`): the current nav item, the selected chip or tab, focus rings, text selection, the primary button, and small markers such as the popular dot. Hover steps to **Signal Orange Hot** (`signal-orange-hot`). On the light theme it darkens to **Signal Orange Paper** (`signal-orange-paper`) for AA contrast.
- **Signal Tint** (`signal-orange-tint`): soft tint for code tokens and selection backgrounds. Active controls use orange at about 15% mix over the surface.

### Neutral
- **Ink Black** (`ink-black`): page background, and the base of every icon cell.
- **Drawer Black** (`drawer-black`): raised surfaces such as inputs, tab groups, chips, code blocks and preview tiles.
- **Hairline** (`hairline`): every border and divider, and the second surface step.
- **Text Primary / Secondary / Muted** (`text-primary`, `text-secondary`, `text-muted`): names and headings / body copy / captions, labels and placeholders.
- **String Tan** (`string-tan`): syntax strings in code samples only.
- **Paper White / Paper Surface / Paper Hairline / Paper Text**: the light-theme counterparts of the black, drawer, hairline and text tokens.

### Status
- **Status Green** (`status-green`) and **Status Red** (`status-red`): success and destructive badges only (for example DEPRECATED). They never decorate.

### Named Rules
**The Signal Rule.** Signal Orange is a marker, not a paint. It covers 10% of a screen at most and always means "current, selected, focused, or the one primary action."

**The Logos Own Colour Rule.** Interface surfaces stay neutral, so that any brand mark can sit on them without clashing. Never tint a surface to match a logo.

## Typography

**Display Font:** Bricolage Grotesque Variable (with system-ui)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace)

**Character:** A wide, slightly quirky variable grotesque for names and headings, set tight and heavy, paired with a sober mono that handles the specimen-label voice: captions, counts, code, and uppercase tracked labels. Stylistic sets `ss01` and `cv11` are on globally.

### Hierarchy
- **Display** (900, `clamp(3rem, 10vw, 8rem)`, 0.85): the home hero only.
- **Headline** (700, 2.25rem rising to 3rem at 640px and up, 1.2): page titles (H1).
- **Title** (700, 1.125rem rising to 1.5rem, 1.2): section headings (H2).
- **Card title** (600, 0.875rem, 1.2): icon names in grid cells.
- **Body** (400, 1rem, 1.6, secondary colour): paragraphs. Lead paragraphs step to 1.125rem; keep the measure at 64ch or less.
- **Label** (mono 600, 0.75rem, 0.18em tracking, uppercase, muted): eyebrows, tabs, chips, badges, and action links.
- **Mono** (mono 500, 0.875rem/0.75rem): inputs, counts, result summaries and code.

### Named Rules
**The Two Voices Rule.** Names and headings speak in the grotesque; metadata, controls and code speak in mono. Never set a body paragraph in mono, or a label in the grotesque.

**The Locked Scale Rule.** Sizes, line-heights and tracking come only from the `--text-*`, `--leading-*` and `--tracking-*` tokens. Don't add one-off rem values.

## Layout

Content sits in a 1400px max container with 24px side gutters. Spacing follows a power-of-two ramp (4, 8, 12, 16, 24, 32, 48, 64). Icon grids run 2 → 3 → 4 → 6 → 8 columns across the sm, md, lg and xl breakpoints. Cells collapse their borders (a −1px margin overlap) into one continuous ruled sheet. Working bars (search, filters) stick under the 56px nav, with a hairline bottom rule. Lists that need more columns than fit scroll sideways and fade at the edge rather than wrapping.

## Elevation & Depth

The system is flat. Depth comes from tonal steps (ink black → drawer black → hairline) and from 1px borders, never from shadows. Overlays (drawers, menus) are separated by a hairline top border and an opaque surface, not by a cast shadow. Hovered and focused grid cells come forward by changing their border to Signal Orange and raising their z-index above their neighbours.

### Named Rules
**The No-Shadow Rule.** There is no `box-shadow` for elevation. If something needs to read as on top, give it an opaque surface step and a hairline.

## Shapes

Everything is square. A global rule forces `border-radius: 0` on every element and pseudo-element, which also flattens third-party UI. Recurring geometry includes 1px hairline frames, small solid squares as markers (the 4px popular dot, swatch squares, the 12×2px accent dash before eyebrows), and bracketed nav labels (`[ SEARCH ]`) for the current page.

## Components

### Buttons
- **Shape:** square (0px).
- **Primary:** a Signal Orange fill with black text, grotesque 600 at 14px, 12px × 24px padding. Hover steps to Signal Orange Hot.
- **Action / secondary:** a hairline-bordered mono uppercase label (12px, 0.18em tracking) in secondary text. Hover raises it to primary text and a muted border. An accent variant uses orange text with a 40% orange border.
- **Text links as actions:** mono uppercase in Signal Orange, such as "FULL PAGE" and "VIEW ALL".

### Chips
- **Style:** a drawer surface with a hairline border, mono uppercase at 10px with 0.18em tracking, muted text.
- **State:** the selected chip takes a 15% orange fill, orange text and a 30% orange border, and exposes `aria-pressed`.

### Tabs / Segmented Controls
- **Style:** a framed `.tab-group` shell (drawer surface, hairline border, 4px inset padding) holding mono uppercase items.
- **Active:** orange text on a 15% orange fill. Swatch pickers use the same shell, and their active square takes an orange border.

### Cards / Containers (Icon Cell)
- **Corner Style:** square.
- **Background:** Ink Black, with a 48px preview tile on Drawer Black (or white/checker, depending on the chosen preview background).
- **Border:** a 1px hairline, collapsed into the grid. Hover turns the border Signal Orange and the fill Drawer Black.
- **Content:** the logo, the name (card title, truncated) and one muted mono meta line such as "2 STYLES". Badges appear only for exceptions (DEPRECATED).

### Inputs / Fields
- **Style:** a Drawer Black field with a hairline border and mono text, plus a search glyph inset at 16px. A `/` key hint shows while empty and a clear button once there is text.
- **Focus:** the border steps to muted text, and the global focus ring is a 2px Signal Orange outline at a 2px offset.

### Navigation
- **Style:** a 56px top bar of hairline-divided cells holding mono uppercase tracked links. The current page shows in Signal Orange inside brackets on a tinted cell, and the GitHub link carries an orange star count. On mobile it collapses to the logo cell and a menu cell.

### Code Blocks (signature)
- Drawer surface with a 2px Signal Orange left rule, IBM Plex Mono, and custom Shiki themes (`devicons-dark` / `devicons-light`) built from the accent ramp and String Tan.

## Do's and Don'ts

### Do:
- **Do** keep every corner square. The global zero-radius rule is the identity.
- **Do** let logos carry the colour. Present them on Ink Black, Drawer Black, white or a checker background, and add a contrast backdrop when an icon is flagged `badInDark` or `badInLight`.
- **Do** reserve Signal Orange for current, selected, focused, or the one primary action.
- **Do** answer presses with solid, tactile state changes (fills and inverted active states) rather than motion or shadow.
- **Do** keep transitions short (150ms ease on colour and border). Drawers use `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Do** theme the browser surfaces: orange selection, a 6px hairline scrollbar, and an orange focus ring.

### Don't:
- **Don't** round anything, or add drop shadows, glows, or glass blur.
- **Don't** restyle, recolour, crop, or reinterpret a brand mark beyond its official colour and monochrome variants.
- **Don't** introduce a second accent hue. Status green and red are for status only.
- **Don't** set body copy in mono or labels in the grotesque.
- **Don't** add metadata badges that are true of nearly every item (such as ACTIVE or a default version). Show exceptions only.
