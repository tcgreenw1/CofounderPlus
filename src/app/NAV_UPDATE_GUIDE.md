# Navigation Update Guide

## Changes Completed ✅

1. **Mobile Bottom Navigation Default Items** - Already updated in `/src/components/MobileLayout.tsx` (lines 399-431):
   - Dashboard
   - Sales
   - Finance
   - Marketing
   - More

## Changes Still Needed

### 1. Mobile "More" Menu Sheet (`/src/components/MobileLayout.tsx`)

**Location:** Lines 1084-1258 (inside `MoreMenuSheet` component)

**Replace the menu items section with:**

Product, HR, Notes, Calendar, Roadmap, Support, Settings

**Remove:** Business Switcher, Cofounder AGI, University, Profile, Notifications, Dark/Light Mode toggle

### 2. Desktop Navigation (`/src/components/DesktopLayout.tsx`)

**Location:** Lines 295-451 (inside `navigationItems` useMemo)

**New default desktop navigation order:**
1. Dashboard
2. Sales (direct link to `/operations/sales`)
3. Finance (direct link to `/operations/finance`) 
4. Marketing (direct link to `/operations/marketing`)
5. Product (direct link to `/operations/product`)
6. HR (direct link to `/operations/hr`)
7. Notes
8. Calendar

**Remove/Hide:**
- "Business OS" dropdown navigation item (operations-hub)
- Any dedicated "Business OS" page route

### 3. Mobile Customization Settings (`/src/components/MobileCustomizationSettings.tsx`)

**Location:** Lines 54-74 (`availableNavItems` array)

**Update available items to match new structure:**
- Dashboard
- Sales
- Finance
- Marketing
- Product
- HR
- Notes
- Calendar
- Roadmap
- Support
- Settings

**Remove:**
- Operations/Business OS
- Cofounder Chat
- HubSpot
- Team
- Subscription
- Security
- Cofounder Settings  
- Theme Toggle
- Profile

### 4. Desktop Nav Customization (`/src/components/DesktopNavCustomization.tsx`)

**Similar updates needed for desktop customization options**

### 5. Backend Endpoint Updates

**File:** `/src/supabase/functions/server/customization-endpoints.tsx`

Ensure default navigation structure matches:

**Mobile defaults:**
```javascript
['dashboard', 'sales', 'finance', 'marketing']
```

**Desktop defaults:**
```javascript
['dashboard', 'sales', 'finance', 'marketing', 'product', 'hr', 'notes', 'calendar']
```

## Design System Compliance

All changes use CSS variables from `/styles/globals.css`:
- Colors: `var(--primary)`, `var(--background)`, `var(--foreground)`, `var(--muted)`, etc.
- Spacing: `var(--spacing-1)` through `var(--spacing-8)`
- Border radius: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`, etc.
- Fonts: Typography uses design system font faces

## Color Coding (for reference)

**Department Colors:**
- Sales: `#FFE54F` (yellow) / `#FFCF00`
- Finance: `#00E0FF` (cyan) / `#1e40af` (blue) 
- Marketing: `#6CFF6C` (green) / `#22c55e`
- Product: `#9333EA` (purple) / `#9b7bff`
- HR: `#FF4F4F` (red)
- Dashboard: Primary theme color
- Notes: `#FFCF00` (yellow)
- Calendar: `#00E0FF` (cyan)
- Roadmap: `#4B00FF` (purple)
- Support: `#6CFF6C` (green)
- Settings: `#4B00FF` (purple)
