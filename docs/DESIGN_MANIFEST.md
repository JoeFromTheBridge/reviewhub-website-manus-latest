## 🔍 Search & Product Listing Page

### Layout & Structure
* **Background:** Apply the global Soft Blue to Soft Lavender gradient to the main viewport.
* **Layout Style:** 2-column layout on Desktop (Sidebar: 280px | Content: Flexible Grid).
* **Grid Specs:** 3-column grid (Desktop), 2-column (Tablet), 1-column (Mobile).
* **Spacing:** 24px gutter between cards; 40px vertical section spacing.

### Color Palette (Search Specific)
| Element | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Filter Sidebar** | `#FFFFFF` | Solid white surface to contrast against page gradient. |
| **Product Card** | `#FFFFFF` | Individual item containers. |
| **Input Borders** | `#E3F2FD` | Ultra-soft blue for search bars and checkboxes. |
| **Selected Tag** | `#F3E5F5` | Background for active filter "chips". |
| **Rating Stars** | `#F59E0B` | Gold color for review scores. |

### Component Specifications

#### 1. Filter Sidebar
* **Surface:** White background with a `1px` right-border (`rgba(0,0,0,0.03)`).
* **Typography:** Category headers in `Secondary Text (#8B8B8B)`, Bold, 12px.
* **Interaction:** Checkboxes should use the `Blue Accent (#5B7DD4)` when active.

#### 2. Product Card
* **Corner Radius:** `12px`
* **Shadow:** `0 4px 12px rgba(0,0,0,0.05)`
* **Border:** `1px solid rgba(0,0,0,0.03)`
* **Image Area:** Products should be centered on a pure white background with `object-fit: contain`.
* **Hover State:** `transform: translateY(-4px)` with shadow increasing to `0 8px 24px rgba(0,0,0,0.08)`.

#### 3. Search Bar
* **Height:** `56px`
* **Background:** `#FFFFFF`
* **Shadow:** `0 2px 10px rgba(0,0,0,0.02)`
* **Icon Color:** `#5B7DD4` (Blue Accent).

### Typography Hierarchy (Cards)
* **Product Title:** 16px, Semi-bold (#000000).
* **Brand/Category:** 12px, Regular (#8B8B8B), Uppercase.
* **Price/Score:** 18px, Bold (#5B7DD4).
