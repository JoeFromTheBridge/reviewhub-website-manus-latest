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
* **Default Radius:** `12px` (Cards and Buttons)
* **Hero Radius:** `20px` (Large feature containers)
* **Sleek Shadow:** `0 4px 20px rgba(0,0,0,0.05)` (Soft, premium depth)
* **Hover Lift:** `transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08);`

---

## 1. Page-Specific Implementations (The Recipes)

### 🏠 Homepage Layout
* **Navigation:** Pure white background, `height: 72px`. `1px` bottom border of `--border-subtle`.
* **Hero Section:** * **Padding:** `120px` top, `80px` bottom (Force high whitespace).
    * **Typography:** Headline `text-3xl`, centered, Serif or Semi-bold Sans.
    * **Main CTA:** Large button using **Hero/CTA Gradient**.
* **Section Headers:** Centered text, `--text-secondary`, uppercase with `0.1em` letter-spacing.
* **"Why ReviewHub" Grid:** * 3-column layout. 
    * Icons: `32px` size, monotone using `--accent-blue`.
* **Footer:** Minimalist white, `--text-secondary` links at `14px`.

### 🔍 Search & Results Page
* **Layout Structure:** Two-column Dashboard.
    * **Sidebar (Filters):** Fixed width `280px`. Pure white background, `1px` right border.
    * **Main Content:** Flexible Product Grid.
* **Search Bar:** `height: 56px`, `12px` radius, centered within a white header wrapper.
* **Product Cards:** * Image Area: `object-fit: contain` on white background.
    * Typography: Title `16px` Bold, Brand `12px` Gray.
    * Price/Rating: Use `--accent-blue` and `--star-gold`.

---

## 2. Component Specifications

### Buttons
* **Primary:** `background: var(--accent-blue)`, `color: #FFFFFF`, `border-radius: 8px`.
* **Secondary:** `background: transparent`, `border: 1px solid var(--accent-blue)`, `color: var(--accent-blue)`.

### Typography Scale
* `--text-xs`: `12px` (Labels)
* `--text-sm`: `14px` (Captions)
* `--text-base`: `16px` (Body)
* `--text-xl`: `24px` (Card Titles)
* `--text-3xl`: `48px` (Hero Headlines)

---

## 3. Implementation Rules for AI
1.  **Whitespace:** Priority #1. If a layout feels crowded, increase padding by `16px` increments.
2.  **Tokens:** Never use hardcoded hex values; always reference the variables above.
3.  **Softness:** Avoid sharp corners or heavy black shadows. Use `12px` radius and `rgba` shadows exclusively.
