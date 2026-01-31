# ReviewHub Design Manifest

## Theme: White, Sleek, Sophisticated
This document is the single source of truth for the ReviewHub interface. It moves from global foundations to specific page implementations to ensure AI implementation consistency.

---

## 0. Global Foundation (The Ingredients)

### Color Palette
| Variable | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--soft-blue` | `#E3F2FD` | Background Gradient Start |
| `--soft-lavender` | `#F3E5F5` | Background Gradient End |
| `--accent-blue` | `#5B7DD4` | Primary Actions, Links, and Branding |
| `--star-gold` | `#F59E0B` | Rating Stars and Highlights |
| `--white-surface` | `#FFFFFF` | Cards, Panels, and Navbars |
| `--text-primary` | `#1A1A1A` | Main Headings and Body Text |
| `--text-secondary` | `#8B8B8B` | Captions, Metadata, and Subtitles |
| `--border-subtle` | `rgba(0,0,0,0.03)` | Ultra-thin dividers and borders |

### Gradients & Global Effects
* **Global Page Background:** `linear-gradient(135deg, var(--soft-blue) 0%, var(--soft-lavender) 100%)`
* **Hero/CTA Gradient:** `linear-gradient(90deg, #5B7DD4 0%, #A391E2 100%)`
* **Default Radius:** `12px` (Cards, Inputs, and Buttons)
* **Hero Radius:** `20px` (Large feature containers)
* **Sleek Shadow:** `0 4px 20px rgba(0,0,0,0.05)` (Soft, premium depth)
* **Hover Lift:** `transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08);`

---

## 1. Page-Specific Implementations (The Recipes)

### 🏠 Homepage Layout
* **Navigation:** Pure white background, `height: 72px`. `1px` bottom border of `--border-subtle`.
* **Hero Section:**
    * **Padding:** `120px` top, `80px` bottom (Force high whitespace).
    * **Typography:** Headline `text-3xl`, centered, Serif or Semi-bold Sans.
    * **Main CTA:** Large button using **Hero/CTA Gradient**.
* **Section Headers:** Centered text, `--text-secondary`, uppercase with `0.1em` letter-spacing.
* **"Why ReviewHub" Grid:** * 3-column layout. 
    * Icons: `32px` size, monotone using `--accent-blue`.

### 🔍 Search & Results Page
* **Layout Structure:** Two-column Dashboard.
    * **Sidebar (Filters):** Fixed width `280px`. Pure white background, `1px` right border.
    * **Main Content:** Flexible Product Grid.
* **Search Bar:** `height: 56px`, `12px` radius, centered within a white header wrapper.
* **Product Cards:**
    * Image Area: `object-fit: contain` on white background.
    * Typography: Title `16px` Bold, Brand `12px` Gray.
    * Price/Rating: Use `--accent-blue` and `--star-gold`.

### 🔐 Create Account / Auth Page
* **Layout Structure:** Centralized Split-Card (`max-width: 900px`).
    * **Left Pane (Value Prop):** 40% width. Features the Logo, Title, and a vertical list of benefits.
    * **Right Pane (Form):** 60% width. Standardized vertical form.
* **Benefit Items:** Icons use a `32px` circular background in `rgba(91, 125, 212, 0.1)` (Faint Blue Accent).
* **Form Inputs:** `height: 48px`, `border: 1px solid var(--border-subtle)`.
* **Social Auth Grid:** 2-column layout for Google/Apple buttons.
* **Primary Action:** Full-width button using **Hero/CTA Gradient**.

---

## 2. Component Specifications

### Buttons
* **Primary:** `background: var(--accent-blue)`, `color: #FFFFFF`, `border-radius: 8px`.
* **Secondary / Ghost:** `background: #FFFFFF`, `border: 1px solid var(--border-subtle)`, `color: var(--text-primary)`.

### Typography Scale
* `--text-xs`: `12px` (Labels/Small Captions)
* `--text-sm`: `14px` (Secondary text)
* `--text-base`: `16px` (Body text)
* `--text-xl`: `24px` (Card Titles / Section Headers)
* `--text-3xl`: `48px` (Hero Headlines)

---

## 3. Implementation Rules for AI
1. **The "Soft Border" Rule:** Avoid pure black or high-contrast borders. Use `--border-subtle`.
2. **Form Focus:** On input focus, transition the border color to `--accent-blue` and add a tiny `2px` glow using `rgba(91, 125, 212, 0.2)`.
3. **Empty States:** Maintain the global background gradient even on auth pages to ensure brand continuity.
4. 
