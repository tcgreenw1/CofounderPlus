# 🎨 Cofounder+ Design System Guide

## Overview

This design system ensures consistency across the entire Cofounder+ application using CSS custom properties (variables) defined in `/styles/globals.css`. All UI components should reference these variables instead of hard-coded values.

---

## 🎨 Color System

### Usage in Tailwind Classes

All colors are available as Tailwind utility classes using the format `bg-{color}`, `text-{color}`, `border-{color}`, etc.

### Light Mode Colors

```css
/* Backgrounds & Surfaces */
--background: #ffffff         → bg-background
--card: #ffffff              → bg-card
--popover: oklch(1 0 0)      → bg-popover

/* Text Colors */
--foreground: oklch(0.145 0 0)     → text-foreground
--card-foreground: oklch(0.145 0 0) → text-card-foreground
--muted-foreground: #717182        → text-muted-foreground

/* Primary Brand */
--primary: #030213           → bg-primary, text-primary
--primary-foreground: oklch(1 0 0) → text-primary-foreground
--primary-soft: rgba(3, 2, 19, 0.1) → bg-primary-soft

/* Secondary */
--secondary: oklch(0.95 0.0058 264.53) → bg-secondary
--secondary-foreground: #030213        → text-secondary-foreground

/* Muted/Subtle */
--muted: #ececf0            → bg-muted
--accent: #e9ebef           → bg-accent

/* Status Colors */
--destructive: #d4183d      → bg-destructive, text-destructive
--success: #27D17C          → bg-success, text-success
--success-soft: rgba(39, 209, 124, 0.1) → bg-success-soft

/* Borders & Inputs */
--border: rgba(0, 0, 0, 0.1) → border-border
--input-background: #f3f3f5  → bg-input-background
--switch-background: #cbced4 → bg-switch-background
```

### Dark Mode Colors

All colors automatically switch in dark mode using the `.dark` class:

```css
--background: oklch(0.145 0 0)    → Automatically applied
--foreground: oklch(0.985 0 0)    → Automatically applied
--primary: oklch(0.985 0 0)       → Inverted colors
/* etc. */
```

---

## 📐 Spacing System

Use these spacing variables for consistent padding, margins, and gaps:

```css
--spacing-1: 0.25rem   (4px)   → p-1, m-1, gap-1
--spacing-2: 0.5rem    (8px)   → p-2, m-2, gap-2
--spacing-3: 0.75rem   (12px)  → p-3, m-3, gap-3
--spacing-4: 1rem      (16px)  → p-4, m-4, gap-4
--spacing-5: 1.25rem   (20px)  → p-5, m-5, gap-5
--spacing-6: 1.5rem    (24px)  → p-6, m-6, gap-6
--spacing-8: 2rem      (32px)  → p-8, m-8, gap-8
```

### Example Usage

```tsx
// ✅ CORRECT - Using design system spacing
<div className="p-4 gap-3">
  <div className="mb-6">Content</div>
</div>

// ❌ WRONG - Hard-coded values
<div className="p-[16px] gap-[12px]">
  <div className="mb-[24px]">Content</div>
</div>
```

---

## 🔘 Border Radius

Use consistent border radius values:

```css
--radius: 0.625rem (10px)

Available utilities:
--radius-sm: calc(var(--radius) - 4px)   → rounded-sm
--radius-md: calc(var(--radius) - 2px)   → rounded-md
--radius-lg: var(--radius)               → rounded-lg
--radius-xl: calc(var(--radius) + 4px)   → rounded-xl
--radius-2xl: calc(var(--radius) + 8px)  → rounded-2xl
--radius-full: 9999px                    → rounded-full
```

### Example Usage

```tsx
// ✅ CORRECT
<div className="rounded-lg bg-card">Card</div>
<button className="rounded-xl">Button</button>

// ❌ WRONG
<div className="rounded-[10px]">Card</div>
<button className="rounded-[14px]">Button</button>
```

---

## 📝 Typography System

### Font Weights

**IMPORTANT**: Never use `font-bold`, `font-semibold`, etc. unless specifically requested.

Default weights are automatically applied via globals.css:

```css
--font-weight-normal: 400    → Already applied to <p>, <input>
--font-weight-medium: 500    → Already applied to <h1>-<h4>, <label>, <button>
--font-weight-semibold: 600  → Use only when needed
--font-weight-bold: 700      → Use only when needed
```

### Typography Hierarchy

The following elements have default styles in globals.css:

```css
h1  → font-size: var(--text-2xl), font-weight: medium
h2  → font-size: var(--text-xl), font-weight: medium
h3  → font-size: var(--text-lg), font-weight: medium
h4  → font-size: var(--text-base), font-weight: medium
p   → font-size: var(--text-base), font-weight: normal
label → font-size: var(--text-base), font-weight: medium
button → font-size: var(--text-base), font-weight: medium
input → font-size: var(--text-base), font-weight: normal
```

### ⚠️ CRITICAL RULES

**DO NOT use these classes unless specifically requested:**
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.
- `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- `leading-none`, `leading-tight`, `leading-normal`, etc.

The design system has pre-configured typography for all semantic HTML elements!

### Example Usage

```tsx
// ✅ CORRECT - Using semantic HTML (automatically styled)
<h1>Main Title</h1>
<h2>Section Heading</h2>
<p>Body text paragraph</p>
<label>Form Label</label>

// ❌ WRONG - Overriding default typography
<h1 className="text-2xl font-bold">Title</h1>
<p className="text-base font-normal">Text</p>
```

---

## 🎨 Chart Colors

For data visualizations, use the chart color palette:

```css
--chart-1: oklch(0.646 0.222 41.116)  → bg-chart-1
--chart-2: oklch(0.6 0.118 184.704)   → bg-chart-2
--chart-3: oklch(0.398 0.07 227.392)  → bg-chart-3
--chart-4: oklch(0.828 0.189 84.429)  → bg-chart-4
--chart-5: oklch(0.769 0.188 70.08)   → bg-chart-5
```

---

## 🧱 Sidebar System

Special variables for sidebar/navigation components:

```css
--sidebar: oklch(0.985 0 0)
--sidebar-foreground: oklch(0.145 0 0)
--sidebar-primary: #030213
--sidebar-accent: oklch(0.97 0 0)
--sidebar-border: oklch(0.922 0 0)

Spacing:
--spacing-sidebar-open: 13rem (208px)
--spacing-sidebar-closed: 4rem (64px)
```

---

## 📱 Mobile-Specific Guidelines

### Safe Area Support

Always account for iOS notches and home indicators:

```tsx
<div className="mobile-safe-area">
  {/* Content automatically padded for safe areas */}
</div>
```

### Touch Targets

Minimum touch target size for mobile:

```tsx
<button className="roadmap-mobile-touch-target">
  {/* Automatically 44px min-height/width */}
</button>
```

### 8-Point Grid System (Mobile Roadmap)

Use these classes for mobile roadmap layouts:

```css
.roadmap-mobile-container        → 16px horizontal padding
.roadmap-mobile-section-spacing  → 24px bottom margin
.roadmap-mobile-card-spacing     → 12px bottom margin
.roadmap-mobile-element-spacing  → 12px bottom margin
.roadmap-mobile-tight-spacing    → 8px bottom margin
```

---

## 🌓 Dark Mode Support

### Automatic Dark Mode

All color variables automatically adjust for dark mode when the `.dark` class is present on `<html>` or a parent element.

### How to Use

```tsx
// Colors automatically adjust - no extra code needed!
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground border-border">
    Content
  </div>
</div>
```

### Gradients

Background gradients are defined in globals.css:

```tsx
// Light mode: Blue/cyan gradient
// Dark mode: Deep blue/purple gradient
// Automatically applied to <html> and <body>
```

---

## ✨ Glass/Blur Effects

Pre-defined glass effect utilities for mobile:

```tsx
<div className="roadmap-mobile-glass">
  {/* Light: rgba(255,255,255,0.75) + blur(16px) */}
  {/* Dark: rgba(0,0,0,0.4) + blur(16px) */}
</div>

<div className="roadmap-mobile-glass-header">
  {/* Slightly different opacity for headers */}
</div>
```

---

## 🎯 Best Practices

### ✅ DO

1. **Use semantic HTML** (`<h1>`, `<h2>`, `<p>`, `<label>`, etc.)
2. **Use design system colors** (`bg-background`, `text-foreground`)
3. **Use spacing variables** (`p-4`, `gap-3`, `mb-6`)
4. **Use border radius utilities** (`rounded-lg`, `rounded-xl`)
5. **Let typography inherit** (don't override unless needed)

### ❌ DON'T

1. **Hard-code colors** (`bg-[#ffffff]`, `text-[#000]`)
2. **Hard-code spacing** (`p-[16px]`, `mb-[24px]`)
3. **Hard-code border radius** (`rounded-[10px]`)
4. **Override font sizes/weights** (unless specifically requested)
5. **Use arbitrary values** when design system values exist

---

## 📚 Component Examples

### Card Component

```tsx
// ✅ CORRECT - Using design system
export function Card({ children }) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border-border p-4">
      {children}
    </div>
  );
}

// ❌ WRONG - Hard-coded values
export function Card({ children }) {
  return (
    <div className="bg-white text-black rounded-[10px] border-[rgba(0,0,0,0.1)] p-[16px]">
      {children}
    </div>
  );
}
```

### Button Component

```tsx
// ✅ CORRECT
export function Button({ children }) {
  return (
    <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
      {children}
    </button>
  );
}
```

### Form Input

```tsx
// ✅ CORRECT
export function Input({ label }) {
  return (
    <div className="space-y-2">
      <label>{label}</label>
      <input 
        className="bg-input-background border-border rounded-lg px-3 py-2 w-full"
      />
    </div>
  );
}
```

### Status Badge

```tsx
// ✅ CORRECT
export function SuccessBadge() {
  return (
    <div className="bg-success text-success-foreground rounded-full px-3 py-1">
      Complete
    </div>
  );
}
```

---

## 🔍 Quick Reference

### Most Common Classes

```tsx
// Backgrounds
bg-background
bg-card
bg-muted
bg-primary
bg-success

// Text Colors
text-foreground
text-muted-foreground
text-primary
text-success

// Spacing
p-4 gap-3 mb-6 mt-2

// Borders
border-border rounded-lg

// Layout
flex flex-col items-center justify-between
grid grid-cols-2 gap-4
```

### Color Combinations

```tsx
// Standard card
<div className="bg-card text-card-foreground border-border">

// Primary button
<button className="bg-primary text-primary-foreground">

// Success state
<div className="bg-success-soft text-success">

// Muted/subtle
<div className="bg-muted text-muted-foreground">
```

---

## 💡 User Customization

Because all UI uses CSS variables, users can customize the entire app by updating values in `/styles/globals.css`:

```css
/* User wants blue primary instead of black */
:root {
  --primary: #0066cc;
}

/* User wants larger spacing */
:root {
  --spacing-4: 1.25rem; /* Instead of 1rem */
}

/* User wants softer corners */
:root {
  --radius: 1rem; /* Instead of 0.625rem */
}
```

All components automatically adapt to these changes!

---

**Remember**: This design system exists to ensure consistency, enable user customization, and support automatic dark mode. Always prefer design system values over hard-coded values!
