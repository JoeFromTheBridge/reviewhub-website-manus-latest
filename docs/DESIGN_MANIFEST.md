# ReviewHub Design Manifest

## Theme: White, Sleek, Sophisticated

This document defines the visual design system for ReviewHub's interface, emphasizing a clean, modern aesthetic that builds trust and professionalism.

---

## Color Palette

### Primary Colors

```css
--soft-blue: #E3F2FD      /* Light blue, backgrounds */
--soft-lavender: #F3E5F5  /* Light purple, accents */
--accent-blue: #2196F3    /* Primary actions, links */
--star-gold: #FFC107      /* Rating stars */
```

### Semantic Colors

```css
--white-surface: #FFFFFF  /* Cards, panels, modals */
--text-primary: #1A1A1A   /* Headings, body text */
--text-secondary: #6B7280 /* Descriptions, metadata */
--border-light: #E5E7EB   /* Dividers, borders */
```

---

## Gradients

### Page Background (Global)

```css
background: linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%);
```

Apply this gradient to all major page containers (Search, Product List, etc.).

---

## Shadows

### Default Card Shadow

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

### Hover Card Shadow (Lift Effect)

```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Input/Search Bar Shadow

```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
```

---

## Border Radius

```css
--radius-sm: 8px   /* Small elements (badges, buttons) */
--radius-md: 12px  /* Product cards, panels */
--radius-lg: 16px  /* Large containers, modals */
--radius-xl: 20px  /* Hero sections, feature cards */
```

---

## Typography

### Font Families

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes

```css
--text-xs: 0.75rem    /* 12px - Labels, captions */
--text-sm: 0.875rem   /* 14px - Secondary text */
--text-base: 1rem     /* 16px - Body text */
--text-lg: 1.125rem   /* 18px - Emphasized text */
--text-xl: 1.25rem    /* 20px - Card titles */
--text-2xl: 1.5rem    /* 24px - Section headers */
--text-3xl: 1.875rem  /* 30px - Page titles */
```

---

## Component Specifications

### Product Cards

```css
border-radius: 12px;
background: #FFFFFF;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
padding: 20px;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State */
&:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}
```

### Search Bar / White Surface

```css
border-radius: 12px;
background: #FFFFFF;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
border: 1px solid #E5E7EB;
padding: 16px;
```

### Sidebar / Filters Panel

```css
border-radius: 12px;
background: #FFFFFF;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
padding: 20px;
```

### Buttons

**Primary Button**
```css
background: #2196F3;
color: #FFFFFF;
border-radius: 8px;
padding: 10px 20px;
box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
transition: all 0.2s ease;

&:hover {
  background: #1976D2;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}
```

**Secondary Button**
```css
background: #F3F4F6;
color: #374151;
border-radius: 8px;
padding: 10px 20px;
border: 1px solid #E5E7EB;
transition: all 0.2s ease;

&:hover {
  background: #E5E7EB;
}
```

### Rating Stars

```css
color: #FFC107; /* star-gold */
font-size: 16px;
```

---

## Spacing System

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

---

## Layout Guidelines

### Container Max Width

```css
max-width: 1280px;
margin: 0 auto;
padding: 0 16px;

@media (min-width: 768px) {
  padding: 0 24px;
}
```

### Grid Layouts

**Product Grid**
```css
display: grid;
grid-template-columns: 1fr;
gap: 24px;

@media (min-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}
```

---

## Motion & Transitions

### Standard Easing

```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### Durations

```css
--duration-fast: 150ms
--duration-base: 200ms
--duration-slow: 300ms
```

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text
- Minimum contrast ratio: 3:1 for large text (18px+)
- Focus states: 2px solid accent-blue with 2px offset
- All interactive elements must have visible focus states

---

## Usage Notes

1. **Consistency First**: Always use design tokens instead of hardcoded values
2. **Responsive**: All components must work on mobile (320px) through desktop (1920px+)
3. **Performance**: Use `will-change` sparingly, only for animated elements
4. **Dark Mode**: Reserved for future implementation (Phase 2)
5. **Images**: Always include alt text and loading states

---

## Implementation Checklist

- [ ] Update Tailwind config with new color tokens
- [ ] Apply gradient background to Search page
- [ ] Update Product Card styles with new shadows and hover effects
- [ ] Style Search Bar with White Surface specs
- [ ] Update star rating colors to star-gold
- [ ] Ensure all border-radius values use 12px for cards
- [ ] Test responsive layout on mobile, tablet, desktop
- [ ] Verify no changes to filtering/search logic

---

**Last Updated:** 2026-01-28
**Status:** Active Design System
**Version:** 1.0.0
