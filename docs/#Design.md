# THE COMPASS — Visual Identity & Design System (V1.1)
Theme: Claymorphic Professional (Light Mode Only)
Framework: SvelteKit + Tailwind CSS + Shadcn-Svelte

## 1. Design Goal
THE COMPASS should feel tactile, refined, and executive-grade.
The interface must evoke soft clay surfaces, inflated cards, and physical pushable controls while remaining highly readable and operationally dense where required.

The system is strictly light mode.
Do not implement or reference dark mode behavior.

---

## 2. Core Visual Principles

### 2.1 Claymorphic Surface Language
All major UI surfaces must feel:
- soft
- inflated
- tactile
- layered
- lightly elevated from the background

Use generous rounding, soft outer shadow, and subtle inner highlight to simulate depth.

### 2.2 Information Hierarchy
Use two densities:
- Low-density views: dashboards, objectives, summaries
- High-density views: KPI tables, forms, submission grids

Even in dense views, preserve air, spacing, and legibility.

### 2.3 Motion Language
All interactive state changes must be smooth and deliberate.
Use `duration-200` for hover, focus, active, and transition states.
No instant visual changes.

---

## 3. Design Tokens

### 3.1 Color Palette
Use these base tokens:

- `--background`: `#e7e5e4` (Stone-200)
- `--card`: `#f5f5f4` (Stone-100)
- `--muted`: `#e7e5e4` (Stone-200)
- `--secondary`: `#d6d3d1` (Stone-300)
- `--foreground`: `#1e293b` (Slate-800)
- `--primary`: `#6366f1` (Indigo-500)
- `--ring`: `#6366f1` (Indigo-500)
- `--border`: a subtle low-contrast stone border
- `--sidebar`: `#d6d3d1` (Stone-300)
- `--sidebar-accent`: a light stone/indigo-tinted active state, never pink
- `--sidebar-accent-foreground`: `#1e293b`

### 3.2 Typography
- Primary sans: `Plus Jakarta Sans`
- Display serif: `Lora`
- Numeric / data mono: `Roboto Mono`

Usage:
- UI labels, body text, controls: Plus Jakarta Sans
- Objective titles and executive headings: Lora
- KPI values, currency, tabular numbers: Roboto Mono

### 3.3 Geometry
- Standard card radius: `1.25rem` / `20px`
- Input radius: `0.75rem`
- Button radius: match card language unless compact control requires smaller rounding
- Never use `rounded-md` or `rounded-lg` for core surfaces

---

## 4. Global Clay Formula

All elevated surfaces should combine:
- a light background
- a subtle border
- a soft outer shadow
- a faint white inner highlight

Recommended pattern:
- outer shadow: `shadow-[2px_2px_10px_4px_rgba(168,162,158,0.18)]`
- inner highlight: `inset 2px 2px 4px rgba(255,255,255,0.8)`

The result should feel inflated, not flat, not glossy, not glassy.

---

## 5. Shared Surface Rules

### 5.1 Clay Card
All dashboard cards, panels, popovers, and major content containers use the clay-card pattern.

Required:
- background: `var(--card)`
- border: `1px solid var(--border)`
- outer shadow + inner highlight
- padding: `p-4` on mobile, `p-6` on desktop
- radius: `1.25rem`

### 5.2 Utility Class
Create a reusable utility in `app.css`:

```css
.clay-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  box-shadow:
    2px 2px 10px 4px rgba(168, 162, 158, 0.18),
    inset 2px 2px 4px rgba(255, 255, 255, 0.8);
}
6. Components
6.1 Buttons

Buttons must feel physical and pressable.

Primary Button
background: #6366f1
text: white
hover: slight lift or brightening
active: scale-95
transition: duration-200
Secondary Button
background: #d6d3d1
text: #1e293b
hover: slight lift
active: scale-95
transition: duration-200

Buttons should feel like molded rubber or polished plastic, never flat rectangles.

6.2 Inputs

Inputs should be slightly recessed.

Required:

background: var(--muted)
radius: 0.75rem
border: subtle stone border
focus border: var(--ring)
focus glow: soft indigo outer glow
transition: duration-200
6.3 Sidebar Navigation

The sidebar should feel like a matte slab, visually heavier than the cards.

Required:

background: var(--sidebar)
overall feel: solid and recessed
active item: light stone/indigo-tinted background
active indicator: 3px indigo bar on the left
active item shape: fully rounded inner pill language, but still aligned to the sidebar geometry
icons: simple Lucide-Svelte icons at size={20}

Do not use pink active states.# THE COMPASS — Visual Identity & Design System (V1.1-FINAL)

**Theme:** Claymorphic Professional (Light Mode Only)
**Framework:** SvelteKit + Tailwind CSS + Shadcn-Svelte
**Status:** Production-Ready — AI Implementation Safe

---

# 1. DESIGN INTENT

THE COMPASS UI must feel:

* Soft, tactile, inflated
* Executive-grade (not playful, not neumorphic gimmicky)
* Highly readable under operational load
* Deterministic in styling (no ambiguity in implementation)

The system uses **Claymorphism adapted for enterprise dashboards**.

---

# 2. GLOBAL CONSTRAINTS (NON-NEGOTIABLE)

1. Light mode only — no dark mode logic anywhere
2. All components follow the same surface language
3. No visual improvisation outside defined tokens
4. Shadows define depth — borders are secondary
5. All interactions must animate (duration-200)

---

# 3. DESIGN TOKENS

## 3.1 Color System

| Token          | Value                  | Usage                |
| -------------- | ---------------------- | -------------------- |
| `--background` | #e7e5e4                | App background       |
| `--card`       | #f5f5f4                | Raised surfaces      |
| `--muted`      | #e7e5e4                | Input background     |
| `--secondary`  | #d6d3d1                | Sidebar / flat areas |
| `--foreground` | #1e293b                | Primary text         |
| `--primary`    | #6366f1                | Actions              |
| `--ring`       | #6366f1                | Focus                |
| `--border`     | rgba(168,162,158,0.25) | Subtle edge          |

### Sidebar

* `--sidebar`: #d6d3d1
* `--sidebar-accent`: rgba(99,102,241,0.08)
* NEVER use purple/pink tones

---

## 3.2 Typography

| Type    | Font              | Usage      |
| ------- | ----------------- | ---------- |
| Primary | Plus Jakarta Sans | UI text    |
| Display | Lora              | Headings   |
| Mono    | Roboto Mono       | KPI values |

Rules:

* KPI numbers MUST use mono
* Objective titles MUST use serif
* No font mixing beyond this system

---

## 3.3 Geometry

| Element | Radius         |
| ------- | -------------- |
| Cards   | 1.25rem (20px) |
| Buttons | 1rem–1.25rem   |
| Inputs  | 0.75rem        |

❗ Never use Tailwind defaults (`rounded-md`, etc.)

---

# 4. CLAYMORPHIC SURFACE MODEL

## 4.1 Core Formula

Every raised surface must include:

* Soft background
* Outer shadow
* Inner highlight

```
Outer Shadow:
2px 2px 10px 4px rgba(168,162,158,0.18)

Inner Highlight:
inset 2px 2px 4px rgba(255,255,255,0.8)
```

---

## 4.2 Utility Class (MANDATORY)

```css
.clay-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  box-shadow:
    2px 2px 10px 4px rgba(168, 162, 158, 0.18),
    inset 2px 2px 4px rgba(255, 255, 255, 0.8);
}
```

---

# 5. COMPONENT SYSTEM

## 5.1 Cards

* Use `.clay-card`
* Padding:

  * Desktop: `p-6`
  * Mobile: `p-4`

Hover:

* Slight elevation increase

---

## 5.2 Buttons

### Primary

* Indigo background
* White text
* `active:scale-95`

### Secondary

* Stone background
* Dark text

### Behavior

* Must feel pressable
* Always animated (`duration-200`)

---

## 5.3 Inputs

* Background: `--muted`
* Slightly recessed look
* Focus:

  * Indigo border
  * Soft glow

---

## 5.4 Sidebar

* Flat, matte surface (NO clay shadow)
* Active item:

  * Light indigo tint
  * Left indicator bar (3px)

Icons:

* Lucide-Svelte
* Size: 20

---

## 5.5 Badges

* Fully rounded (`rounded-full`)
* Compact
* Used for KPI states:

  * Below Min
  * On Track
  * Above Ideal

---

## 5.6 Progress Bars

* Height: `h-4`
* Fully rounded
* Track: light indigo
* Fill: indigo

---

# 6. INTERACTION MODEL

Every interactive element must have:

* `transition-all`
* `duration-200`

### States

| State    | Behavior        |
| -------- | --------------- |
| Hover    | Slight lift     |
| Active   | Scale down      |
| Focus    | Indigo ring     |
| Disabled | Reduced opacity |

---

# 7. LAYOUT RULES

## 7.1 Spacing

* Grid gap: `gap-6` or `gap-8`
* Container: `max-w-7xl`
* No cramped layouts

---

## 7.2 Density

### Low Density

* Objective cards
* Dashboards

### High Density

* KPI tables

Use muted backgrounds instead of borders.

---

# 8. VIEW-SPECIFIC RULES

## 8.1 KPI Tables

* Header: flat
* Rows:

  * Hover → lift effect
* No heavy borders
* Use mono font for numbers

---

## 8.2 Objective Cards

* Title → Lora
* KPI values → Mono
* Large spacing
* Thick progress bar

---

# 9. ANIMATION RULES

* No instant transitions
* No bounce / elastic effects
* Only subtle motion

---

# 10. ACCESSIBILITY

* High contrast text
* Visible focus states
* Clear hierarchy
* Keyboard navigable

Clay effect must NEVER reduce readability.

---

# 11. IMPLEMENTATION DIRECTIVES

* Use Tailwind classes
* Use Shadcn-Svelte components
* Use Lucide-Svelte icons
* Prefer reusable utilities
* No inline hacks
* No dark mode logic

---

# 12. FAILURE CONDITIONS (STRICT)

These are considered design violations:

* Using non-approved colors
* Missing shadow layering
* Using Tailwind default radii
* Adding gradients/glassmorphism
* No interaction animation
* Sidebar using clay effect

---

# FINAL NOTE

If a style is not defined in this document:

→ It must NOT be invented
→ It must NOT be approximated
→ It must be added via versioned update

This ensures full alignment with the SSoT philosophy of zero ambiguity.


6.4 Badges

Status badges must be:

pill-shaped
compact
high contrast
readable at a glance

Examples:

Below Min
On Track
Above Ideal
Overdue
6.5 Progress Bars

Use a thick, highly rounded progress bar for objective cards.

Required:

height: h-4
track: light indigo tint
fill: solid indigo
radius: fully rounded
7. View-Specific Rules
7.1 KPI Submission Table

Applies to submission tables and weekly KPI data views.

Rules:

table header: flat, minimal, no shadow
rows: soft hover lift
row hover: slightly stronger shadow
data rows: use muted row separators or muted row backgrounds
avoid heavy borders inside the table
status badges must be pill-shaped
numeric cells should use Roboto Mono
7.2 Objective Cards

Objective cards should read as executive summaries.

Rules:

objective title: Lora
supporting text: Plus Jakarta Sans
key numbers: Roboto Mono
progress bar: thick and rounded
spacing: generous, airy, premium
8. Spacing and Layout
8.1 Layout Constraints
dashboard max width: max-w-7xl
card gap: gap-6 or gap-8
maintain whitespace between major regions
avoid cramped layouts
8.2 Density Rules

Low-density surfaces:

objectives
overview panels
summary cards

High-density surfaces:

KPI input tables
data-entry forms
submission grids

For dense views, use muted row backgrounds and clear alignment instead of heavy borders.

9. Interaction Rules

Every interactive surface must have:

transition-all
duration-200
hover feedback
focus feedback
active feedback

Cards and buttons should visually respond to pointer interaction.
Active presses should feel tactile, not abrupt.

10. Accessibility and Readability

The system must preserve:

strong text contrast
visible focus states
clear hierarchy
readable data alignment
keyboard navigability

Claymorphism must never reduce usability.

11. Implementation Notes
Use Tailwind CSS for all styling.
Use Shadcn-Svelte for primitives and composition.
Use Lucide-Svelte for icons.
Prefer reusable classes and theme tokens over one-off styling.
Keep all surfaces consistent with the clay-card language.
Do not implement dark mode.
Do not introduce glossy, glassy, neon, or neon-gradient surfaces.