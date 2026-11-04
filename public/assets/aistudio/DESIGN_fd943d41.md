---
name: Logistics Soft Console
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-num:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an ergonomic, high-utility operational interface tailored for high-throughput logistics and warehouse management environments. Built on a foundation of modern minimalist soft-tactility, it marries the legibility of enterprise utility with the physical clarity of soft dimensional surfaces.

### Personality & Tone
- **Dependable & Resilient:** Predictable, high-contrast states engineered for rapid scanning in demanding warehouse floor lighting.
- **Ergonomic & Tactile:** Subtle extruded planes, calibrated dual-source light models, and clear depth cues create an intuitive sense of touch feedback for mobile barcode scanning and inventory tracking.
- **Systematic & Clean:** Low visual noise, structured whitespace, and strict typographic hierarchy that minimize operator fatigue during long shifts.

### Visual Style
The aesthetic synthesizes modern SaaS clarity with restrained soft-tactility (approachable neumorphic extrusion paired with structured micro-borders). Rather than heavy, low-contrast skeuomorphism, the system applies crisp `#E2E8F0` micro-borders combined with dual ambient diffuse light sources to anchor components firmly against cool slate backgrounds (`#F8FAFC` and `#F1F5F9`). Cobalt accents serve as decisive operational triggers, balanced by emerald verification markers and amber cautionary status indicators.

## Colors

The color palette is calibrated for high daylight and warehouse artificial lighting legibility, using cool slate base tones, distinct primary interaction points, and semantic dispatch cues.

### Primary & Accents
- **Primary Cobalt (`#2563EB`):** Applied to primary actions, interactive focus rings, active scan indicators, and confirmed selection states. High contrast against slate surfaces.
- **Secondary Emerald (`#10B981`):** Reserved for verification states, completed picks, matched barcodes, and successful pallet dispatches.
- **Tertiary Amber (`#F59E0B`):** Dedicated to pending verification, hazardous cargo flags, bin capacity alerts, and exception workflows.

### Surfaces & Neutrals
- **Canvas Base:** `#F8FAFC` provides a clean, cool neutral canvas that prevents eye fatigue.
- **Surface Elevation (Cards/Containers):** `#FFFFFF` paired with `#F1F5F9` structural wells.
- **Micro-Borders:** `#E2E8F0` ensures high structural definition regardless of ambient screen tilt.
- **Typography & Icons:** `#0F172A` (Slate 900) for primary titles; `#334155` (Slate 700) for body and labels; `#64748B` (Slate 500) for metadata, structural icons, and unit specifications.

## Typography

The typographic hierarchy relies entirely on Inter, prioritized for optical clarity at varying handheld distances and extreme scan angles. 

### Typographic Rules
- **Numerical Regularity:** Pallet IDs, bin coordinates, and SKU weights use `code-num` (Inter with tabular figures activated: `font-feature-settings: "tnum" 1`) to preserve vertical alignment across dense logistics tables.
- **Hierarchy Anchors:** High-level overview metrics rely on `display-sm` or `display-lg`, while field data labels use uppercase `label-sm` with slight positive tracking (`letterSpacing: 0.04em`) to establish crisp contrast against dynamic field values.
- **Mobile Readability:** Line heights never fall below 1.25x the font size, preventing accidental misinterpretation of multi-line shipment addresses or handling instructions.

## Layout & Spacing

Designed primarily for mobile handheld terminals (e.g., rugged Android scanners, phone-based pick-to-light systems), the layout balances dense data aggregation with large, error-free tap zones.

### Grid & Density Rules
- **Base Grid:** 8px base grid system, with 4px sub-increments (`space-xs`) for fine label-to-input associations.
- **Canvas Margins:** Mobile viewport margins adhere to `margin` (16px), expanding to 24px (`space-lg`) on tablet mounts mounted to forklifts.
- **Target Sizes:** Touch targets must maintain a minimum physical height of 48px to accommodate gloved operation in cold storage or sorting hubs.
- **Component Breathing Room:** Card padding uses `space-md` (16px) internally, with itemized SKU lists spaced apart by `space-sm` (8px) to maximize screen real estate without crowding tap affordances.

## Elevation & Depth

Visual hierarchy leverages soft-tactile dimensional elevation: a directional light source simulated from top-left (135 degrees), casting ambient cool shadows paired with crisp micro-outlines to avoid the washed-out contrast common in pure neumorphism.

### Elevation Levels

- **Sunken Surface (Wells / Inset Inputs / Scan Fields):**
  - Simulated recession into the canvas.
  - Used for barcode scanning viewfinders, search fields, and unchecked toggles.
  - Shadow recipe: Inset drop shadow (`inset 2px 2px 5px rgba(15, 23, 42, 0.06), inset -2px -2px 5px rgba(255, 255, 255, 0.8)`), bounded by border `1px solid #E2E8F0`.

- **Resting Surface (Cards / Panels):**
  - Soft extruded lift above the `#F8FAFC` background.
  - Background: `#FFFFFF`.
  - Border: `1px solid #E2E8F0`.
  - Shadow recipe: Dual ambient drop shadow (`4px 4px 12px rgba(148, 163, 184, 0.14), -4px -4px 12px rgba(255, 255, 255, 0.9)`).

- **Raised Interactive (Buttons / Active Badges / Floating Confirmations):**
  - Elevated for clear affordance.
  - Shadow recipe: `6px 6px 16px rgba(37, 99, 235, 0.2), -2px -2px 8px rgba(255, 255, 255, 0.8)`.

- **Pressed / Active State:**
  - Collapse of outer shadow into a flat or slightly inset ring (`inset 1px 1px 3px rgba(15, 23, 42, 0.15)`), giving instant mechanical confirmation on finger contact.

## Shapes

The design system uses level `2` roundedness, establishing a balanced aesthetic with 8px (`0.5rem`) base radii for standard modules and controls.

### Radius Assignments
- **Base (8px / `0.5rem`):** Applied to standard interactive cards, input containers, barcode display panels, and action sheets.
- **Large (16px / `1rem`):** Applied to bottom modal sheets, dashboard summary banners, and floating scan prompts.
- **Pill (Full Round / 9999px):** Applied to status badges (e.g., "STAGED", "IN TRANSIT"), inventory counter chips, and floating quick-filter tags.

## Components

### Buttons
- **Primary Dispatch Action:** Cobalt background (`#2563EB`), text `#FFFFFF`, rounded 8px. Height 48px minimum. Subtly extruded with a dual shadow; on active press, shifts to `#1D4ED8` with flattened elevation.
- **Secondary / Action Wells:** White surface (`#FFFFFF`) with `#E2E8F0` micro-border, `#0F172A` text, and resting dual drop shadow.
- **Destructive / Flag Action:** Soft red fill (`#FEF2F2`), border `#FCA5A5`, text `#DC2626`.

### Cards & Item Containers
- **Pallet / SKU Cards:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, corner radius 8px, dual ambient shadow. Internal layout consists of a header row with SKU identifier in `label-lg`, a status pill right-aligned, followed by a partitioned 2-column key-value matrix (Location vs. Quantity).

### Input Fields & Barcode Readers
- **Text & Numeric Inputs:** Recessed styling (`inset 2px 2px 4px rgba(148, 163, 184, 0.12)`), background `#F1F5F9`, border `1px solid #CBD5E1`. On focus, transitions to background `#FFFFFF` with border `1.5px solid #2563EB` and a cobalt glow ring.
- **Scan Gun Target View:** High-contrast sunken box with pulsing Cobalt corner guides and a subtle Emerald sweep indicator when an item is recognized.

### Badges & Status Chips
- **Success (Pick Confirmed):** Full pill (`rounded-full`), background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`.
- **Warning (Shortage / Hold):** Full pill, background `#FFFBEB`, text `#92400E`, border `1px solid #FDE68A`.
- **Neutral (Queued / Idle):** Full pill, background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Selection Controls
- **Checkboxes & Radios:** Custom tactile toggle squares (20x20px, rounded 4px) and circles (20x20px). Unchecked: inset soft well background `#F1F5F9` with `#CBD5E1` border. Checked: primary cobalt fill (`#2563EB`) with crisp white interior check icon, casting a 2px diffuse cobalt drop shadow.