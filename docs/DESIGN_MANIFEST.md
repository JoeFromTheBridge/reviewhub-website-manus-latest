# ReviewHub Design Manifest

## Theme: White, Sleek, Sophisticated
This document is the single source of truth for the ReviewHub interface, moving from global foundations to specific page implementations.

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
* **Hero Section Padding:** `120px` top, `80px` bottom.
* **Featured Products:** 3-column grid of white cards.
* **Why ReviewHub Icons:** `32px` monotone icons on light lavender/blue backgrounds.

### 🔍 Search & Results Page
* **Layout Structure:** Sidebar (280px) + Flexible Main Grid.
* **Product Grid:** Responsive (1 to 4 columns).

### 🔐 Create Account / Auth Page
* **Split-Card Layout:** 40% Brand/Value Prop | 60% Functional Form.
* **Auth Buttons:** Social logins use "Ghost" style to prioritize the main "Sign Up" gradient button.

### 📦 Product Detail Page (PDP)
* **Hero Area:** Two-column split.
    * **Left (Image):** Standard white card (`--radius-md`) with `object-fit: contain`.
    * **Right (Info):** Large serif headline, bold price, and standard star rating component.
* **Review Overview:**
    * **Progress Bars:** Height `8px`, `--radius-sm`. Fill color: `--star-gold`.
* **Review Feed:** * Individual review cards use standard card styling.
    * Action buttons (Helpful/Not Helpful) use secondary "Ghost" button styling.

---

## 2. Component Specifications

### Buttons
* **Primary:** `background: var(--accent-blue)`, `color: #FFFFFF`, `border-radius: 8px`.
* **Secondary / Ghost:** `background: #FFFFFF`, `border: 1px solid var(--border-subtle)`, `color: var(--text-primary)`.

### Typography Scale
* `--text-xs`: `12px` (Labels)
* `--text-sm`: `14px` (Secondary text)
* `--text-base`: `16px` (Body text)
* `--text-xl`: `24px` (Card Titles / Section Headers)
* `--text-3xl`: `48px` (Hero Headlines)

---

## 3. Implementation Rules for AI
1. **Consistency:** Never hardcode hex values; always reference the variables above.
2. **Whitespace:** Maintain high padding (increments of 16px/24px/32px) to ensure the "Sleek" feel.
3. **Softness:** Avoid pure black or sharp edges. Use `--border-subtle` for all visible lines.
4. 
