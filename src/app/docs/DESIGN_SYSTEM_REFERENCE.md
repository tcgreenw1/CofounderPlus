# Cofounder+ Design System Reference

## Overview
All UI generation for Cofounder+ must strictly adhere to the CSS variables and font faces defined in `/styles/globals.css`. This ensures consistent "Toy Box Pop" aesthetics and allows centralized styling control.

## Design System Location
**Primary File:** `/styles/globals.css`

This file contains all design tokens including:
- Color palette (light & dark mode)
- Spacing & sizing
- Border radius
- Typography weights
- Font families

## Typography System

### Font Weights (CSS Variables)
```css
--font-weight-medium: 500;
--font-weight-normal: 400;
```

### ⚠️ CRITICAL TYPOGRAPHY RULES

**DO NOT USE** these Tailwind typography classes:
- ❌ `text-xl`, `text-2xl`, `text-lg`, `text-sm` (font sizes)
- ❌ `font-bold`, `font-semibold`, `font-medium` (font weights)
- ❌ `leading-tight`, `leading-none`, `leading-relaxed` (line heights)

**WHY:** The globals.css file has default typography for each HTML element defined in the `@layer base` section:
- `<h1>` → Default heading 1 styling (font-size, weight: 500, line-height: 1.5)
- `<h2>` → Default heading 2 styling (font-size, weight: 500, line-height: 1.5)
- `<h3>` → Default heading 3 styling (font-size, weight: 500, line-height: 1.5)
- `<h4>` → Default heading 4 styling (font-size, weight: 500, line-height: 1.5)
- `<p>` → Default paragraph styling (font-size, weight: 400, line-height: 1.5)
- `<label>` → Default label styling (font-size, weight: 500, line-height: 1.5)
- `<button>` → Default button styling (font-size, weight: 500, line-height: 1.5)
- `<input>` → Default input styling (font-size, weight: 400, line-height: 1.5)

**INSTEAD:** Use semantic HTML elements (`<h1>`, `<h2>`, `<p>`, etc.) and let the CSS variables control styling.

**NOTE:** The actual font-size values are defined using CSS variables that reference the text size scale. The system automatically applies appropriate sizing to each element.

## Color Palette

### Light Mode Colors
```css
--background: #ffffff;
--foreground: oklch(0.145 0 0);
--primary: #030213;
--primary-foreground: oklch(1 0 0);
--secondary: oklch(0.95 0.0058 264.53);
--secondary-foreground: #030213;
--muted: #ececf0;
--muted-foreground: #717182;
--accent: #e9ebef;
--accent-foreground: #030213;
--destructive: #d4183d;
--destructive-foreground: #ffffff;
--border: rgba(0, 0, 0, 0.1);
--input: transparent;
--input-background: #f3f3f5;
--switch-background: #cbced4;
```

### Dark Mode Colors
```css
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--primary: oklch(0.985 0 0);
--primary-foreground: oklch(0.205 0 0);
--secondary: oklch(0.269 0 0);
--secondary-foreground: oklch(0.985 0 0);
--muted: oklch(0.269 0 0);
--muted-foreground: oklch(0.708 0 0);
--accent: oklch(0.269 0 0);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.396 0.141 25.723);
--destructive-foreground: oklch(0.637 0.237 25.331);
--border: oklch(0.269 0 0);
```

### Chart Colors (Both Modes)
```css
--chart-1: oklch(0.646 0.222 41.116);
--chart-2: oklch(0.6 0.118 184.704);
--chart-3: oklch(0.398 0.07 227.392);
--chart-4: oklch(0.828 0.189 84.429);
--chart-5: oklch(0.769 0.188 70.08);
```

## Border Radius System
```css
--radius: 0.625rem;         /* Base radius */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

## Using CSS Variables in Components

### ✅ CORRECT Usage
```tsx
// Colors - Use Tailwind classes that reference CSS variables
<div className="bg-primary text-primary-foreground">
  <h2>Welcome</h2>  {/* Will use default h2 styling */}
  <p>This is a paragraph</p>  {/* Will use default p styling */}
</div>

<button className="bg-accent text-accent-foreground rounded-lg">
  Click Me
</button>

// Border radius
<div className="rounded-lg">  {/* Uses --radius-lg */}
<div className="rounded-md">  {/* Uses --radius-md */}
```

### ❌ INCORRECT Usage
```tsx
// DON'T hardcode colors
<div className="bg-blue-500 text-white">

// DON'T use Tailwind typography classes
<h2 className="text-2xl font-bold">  {/* ❌ */}

// DON'T hardcode border radius
<div style={{ borderRadius: '10px' }}>  {/* ❌ */}
```

## Available Tailwind Classes (Auto-Generated)

These Tailwind classes are automatically mapped to CSS variables:
- `bg-background`, `bg-foreground`, `bg-primary`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-destructive`
- `text-foreground`, `text-primary-foreground`, `text-secondary-foreground`, etc.
- `border-border`
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`

## Special Design Elements

### "Toy Box Pop" Aesthetic
The design system includes vibrant, playful elements:
- Colorful scrollbars with gradient (blue → yellow → green → red)
- Starry backgrounds for homepage (dark mode)
- Smooth animations and transitions
- High contrast, bold UI elements

### Scrollbars
Custom scrollbars are defined:
```css
/* Vibrant gradient scrollbar thumb */
background: linear-gradient(180deg, #2b7fff 0%, #ffe020 33%, #00a73d 66%, #ff4f50 100%);
```

### Mobile-Specific Styling
Mobile layouts use:
- Bahnschrift font family
- Glass-morphism effects: `backdrop-filter: blur(25px)`
- Bottom navigation bar with safe area insets
- Touch-optimized spacing

## Component Guidelines

### When Creating New Components:
1. **Use semantic HTML** (`<h1>`, `<h2>`, `<p>`, `<button>`, etc.)
2. **Use Tailwind color classes** that reference CSS variables (`bg-primary`, `text-foreground`)
3. **Use Tailwind radius classes** (`rounded-lg`, `rounded-md`)
4. **DO NOT specify font sizes, weights, or line heights** unless absolutely necessary
5. **Test in both light and dark mode** (CSS variables handle this automatically)

### When Modifying Existing Components:
1. **Preserve existing class names** that use the design system
2. **Check for hardcoded styles** and replace with CSS variable classes
3. **Ensure consistency** with the rest of the app

## Updating the Design System

To update colors, spacing, or typography across the entire app:
1. Edit `/styles/globals.css`
2. Update the CSS variable values
3. All components using the design system will update automatically

## Example Component

```tsx
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";

export function ExampleCard() {
  return (
    <Card className="bg-card border-border rounded-lg p-6">
      <h2>Dashboard</h2>  {/* Auto-styled via CSS */}
      <p className="text-muted-foreground">
        Your overview for today
      </p>
      <Button className="bg-primary text-primary-foreground rounded-md">
        Get Started
      </Button>
    </Card>
  );
}
```

## Summary Checklist

✅ Use CSS variable-based Tailwind classes  
✅ Use semantic HTML elements for typography  
✅ Use `rounded-*` classes for border radius  
✅ Test in light and dark mode  
❌ No hardcoded colors or styles  
❌ No Tailwind typography classes (text-xl, font-bold, etc.)  
❌ No custom border radius values  

---

**Remember:** The design system ensures consistency, maintainability, and allows the user to control all styling through `/styles/globals.css`.