# Design System Compliance Guide

## Overview
All UI components in Cofounder+ MUST use CSS variables defined in `/src/styles/globals.css` to ensure consistent styling, theme support (light/dark/pink), and user customizability.

## ✅ Required Practices

### 1. Colors
**ALWAYS use CSS variables for all colors:**

```tsx
// ✅ CORRECT
<div style={{ color: 'var(--primary)', background: 'var(--card)' }}>
<Button style={{ background: 'var(--success)' }}>

// ❌ WRONG
<div style={{ color: '#00E0FF', background: 'white' }}>
<Button style={{ background: '#6CFF6C' }}>
```

**Available Color Variables:**
- Brand: `--primary`, `--accent`, `--action`, `--success`, `--energy`
- UI Elements: `--card`, `--popover`, `--secondary`, `--muted`
- Semantic: `--destructive`, `--success`, `--muted-foreground`
- Borders: `--border`, `--ring`
- All colors have `-foreground` variants for text

### 2. Spacing
**ALWAYS use spacing variables:**

```tsx
// ✅ CORRECT
<div style={{ 
  padding: 'var(--spacing-4)',
  gap: 'var(--spacing-2)',
  marginBottom: 'var(--spacing-6)'
}}>

// ❌ WRONG
<div style={{ 
  padding: '16px',
  gap: '8px',
  marginBottom: '24px'
}}>
```

**Available Spacing Variables:**
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)

### 3. Border Radius
**ALWAYS use radius variables:**

```tsx
// ✅ CORRECT
<Card style={{ borderRadius: 'var(--radius-lg)' }}>
<div style={{ borderRadius: 'var(--radius-md)' }}>

// ❌ WRONG
<Card style={{ borderRadius: '10px' }}>
<div style={{ borderRadius: '8px' }}>
```

**Available Radius Variables:**
- `--radius-sm`: ~6px
- `--radius-md`: ~8px
- `--radius-lg`: 10px (default)
- `--radius-xl`: ~14px
- `--radius-2xl`: ~20px
- `--radius-3xl`: ~28px
- `--radius-full`: 9999px (circles)

### 4. Typography
**Use semantic HTML elements (h1, h2, h3, p) instead of styled divs:**

```tsx
// ✅ CORRECT - Typography is handled by globals.css
<h2>Marketing Studio</h2>
<p style={{ color: 'var(--muted-foreground)' }}>
  View and manage all generated marketing content
</p>

// ❌ WRONG - Don't manually set font-size/font-weight unless necessary
<div style={{ fontSize: '24px', fontWeight: '600' }}>Marketing Studio</div>
```

**Available Typography Variables (use only when semantic HTML doesn't work):**
- Font sizes: `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`
- Font weights: `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`

### 5. Borders
**ALWAYS use border variables:**

```tsx
// ✅ CORRECT
<Card style={{ border: '1px solid var(--border)' }}>

// ❌ WRONG
<Card style={{ border: '1px solid rgba(0, 224, 255, 0.15)' }}>
```

## 🎨 Toy Box Pop Aesthetic

Our design system features vibrant "Toy Box Pop" colors:
- **Primary (Cyan)**: `#00E0FF` - Brand identity (changes to Pink in theme-pink mode)
- **Action (Coral Red)**: `#FF4F4F` - Call-to-actions, destructive actions
- **Success (Lime Green)**: `#6CFF6C` - Success states, positive feedback
- **Accent (Blue)**: `#2b7fff` - Secondary brand color (changes to Purple in theme-pink mode)
- **Energy (Yellow)**: `#FFCF00` - Energy, warnings, highlights

## 📱 Theme Support

Our app supports 3 themes that automatically work when using CSS variables:
1. **Light Mode**: Bright, vibrant colors on white
2. **Dark Mode**: Same vibrant colors on dark backgrounds
3. **Pink Theme**: Replaces cyan/blue with pink/purple throughout

**When you use CSS variables, all themes work automatically. When you hardcode colors, themes break.**

## ✅ Component Checklist

Before creating/modifying a component, verify:

- [ ] All colors use `var(--color-name)`
- [ ] All spacing uses `var(--spacing-N)`
- [ ] All border-radius uses `var(--radius-size)`
- [ ] Typography uses semantic HTML (h1, h2, h3, p) where possible
- [ ] Borders use `var(--border)`
- [ ] No hardcoded pixel values for spacing
- [ ] No hardcoded hex colors
- [ ] Component works in light/dark/pink themes

## 📝 Example: Compliant Component

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function ExampleComponent() {
  return (
    <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle style={{ color: 'var(--primary)' }}>
          Product Marketing
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
          <Button style={{ background: 'var(--success)', color: 'var(--success-foreground)' }}>
            Create Plan
          </Button>
          <Button style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
            View Studio
          </Button>
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>
          Generate marketing content for your products
        </p>
      </CardContent>
    </Card>
  );
}
```

## 🚫 Common Mistakes

### Mistake 1: Hardcoded Colors
```tsx
// ❌ WRONG
<div style={{ background: '#00E0FF' }}>
// ✅ CORRECT
<div style={{ background: 'var(--primary)' }}>
```

### Mistake 2: Hardcoded Spacing
```tsx
// ❌ WRONG
<div style={{ padding: '16px', marginBottom: '24px' }}>
// ✅ CORRECT
<div style={{ padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
```

### Mistake 3: Hardcoded Border Radius
```tsx
// ❌ WRONG
<Card style={{ borderRadius: '10px' }}>
// ✅ CORRECT
<Card style={{ borderRadius: 'var(--radius-lg)' }}>
```

### Mistake 4: Manual Typography Instead of Semantic HTML
```tsx
// ❌ WRONG
<div style={{ fontSize: '24px', fontWeight: '600' }}>Title</div>
// ✅ CORRECT
<h2>Title</h2>
```

### Mistake 5: Mixing Units
```tsx
// ❌ WRONG
<div style={{ padding: 'var(--spacing-4)', margin: '20px' }}>
// ✅ CORRECT
<div style={{ padding: 'var(--spacing-4)', margin: 'var(--spacing-6)' }}>
```

## 📚 Quick Reference

### Most Common Patterns

**Card with proper styling:**
```tsx
<Card style={{ 
  borderRadius: 'var(--radius-lg)', 
  border: '1px solid var(--border)',
  background: 'var(--card)' 
}}>
```

**Button spacing:**
```tsx
<div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

**Section spacing:**
```tsx
<div style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 'var(--spacing-6)' 
}}>
  <Section1 />
  <Section2 />
</div>
```

**Muted text:**
```tsx
<p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>
  Helper text
</p>
```

## 🎯 Summary

**Golden Rule:** If you're typing a pixel value, hex color, or hardcoded size, you're probably doing it wrong. Use the design system variables instead.

This ensures:
- ✅ Consistent design across the app
- ✅ All themes work automatically
- ✅ Users can customize the design by editing CSS
- ✅ Easy maintenance and updates
- ✅ Professional, cohesive UI
