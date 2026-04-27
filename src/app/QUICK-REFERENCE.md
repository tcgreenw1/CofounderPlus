# 🚀 Cofounder+ Quick Reference

## ✅ Migration Status: COMPLETE

All 18 server files and 25+ chat endpoints successfully migrated to ChatGPT-5.1.

---

## 🎨 Design System - Quick Guide

### When Generating UI, ALWAYS:

✅ **Use these color classes:**
```tsx
bg-background bg-card bg-primary bg-success bg-muted
text-foreground text-primary text-muted-foreground
border-border
```

✅ **Use these spacing classes:**
```tsx
p-4 p-6 gap-3 mb-6 mt-2
// Corresponds to 16px, 24px, 12px, 24px, 8px
```

✅ **Use these border radius classes:**
```tsx
rounded-lg rounded-xl rounded-full
```

✅ **Use semantic HTML (gets automatic styling):**
```tsx
<h1>Title</h1>          // Auto-styled
<h2>Subtitle</h2>       // Auto-styled
<p>Body text</p>        // Auto-styled
<label>Label</label>    // Auto-styled
```

### NEVER (unless user specifically requests):

❌ Hard-code colors: `bg-[#ffffff]`  
❌ Hard-code spacing: `p-[16px]`  
❌ Use font classes: `text-xl`, `font-bold`  
❌ Use line-height: `leading-tight`

---

## 🤖 GPT-5.1 API Format

All chat endpoints now use:

```typescript
fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: 'chatgpt-5.1',
    input: messages,  // NOT 'messages'
    max_output_tokens: 2000,  // NOT 'max_tokens'
    temperature: 0.7
  })
});

// Extract response
const response =
  data.output_text ??
  data?.output?.[0]?.content?.[0]?.text ??
  "fallback";
```

---

## 📁 Key Files

### Documentation
- `/MIGRATION-STATUS-FINAL.md` - Complete migration status
- `/DESIGN-SYSTEM-GUIDE.md` - Full design system guide  
- `/GPT-5.1-MIGRATION-COMPLETE.md` - Migration summary

### Configuration
- `/styles/globals.css` - CSS variables & design system
- `/supabase/functions/server/index.tsx` - Main server file

### Production Server Files (all updated ✅)
- `/supabase/functions/server/*.tsx` - All production endpoints

---

## 🎯 Common Tasks

### Creating a Card Component
```tsx
<div className="bg-card text-card-foreground rounded-lg border border-border p-4">
  <h3>Card Title</h3>
  <p>Card content automatically styled</p>
</div>
```

### Creating a Button
```tsx
<button className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
  Click Me
</button>
```

### Creating a Success Badge
```tsx
<div className="bg-success text-success-foreground rounded-full px-3 py-1">
  ✓ Complete
</div>
```

### Creating a Form Input
```tsx
<div className="space-y-2">
  <label>Input Label</label>
  <input 
    className="bg-input-background border border-border rounded-lg px-3 py-2 w-full"
    placeholder="Enter text..."
  />
</div>
```

---

## 🌓 Dark Mode

**Automatic!** No extra code needed.

```tsx
// This automatically adjusts for dark mode
<div className="bg-background text-foreground">
  <div className="bg-card border-border">
    Content
  </div>
</div>
```

---

## 📱 Mobile-First Classes

```tsx
// Safe area support (iOS notches)
<div className="mobile-safe-area">

// Touch target (minimum 44px)
<button className="roadmap-mobile-touch-target">

// Glass effect
<div className="roadmap-mobile-glass">
```

---

## ✨ Testing Checklist

After any changes, test:

1. **Main Chat** - `/cofounder-chat`
2. **Department Chats** - HR, Sales, Product, Marketing, Finance
3. **AGI Roadmap** - Personalized roadmap generation
4. **AI Features** - Categorization, receipt processing, etc.
5. **Dark Mode** - Toggle and verify all colors work
6. **Mobile** - Test responsive design

---

## 🐛 Common Issues

### "API Error 404"
- Old API endpoint being used
- Check for `chat/completions` → should be `responses`

### "undefined output"
- Response extraction incorrect
- Use: `data.output_text ?? data?.output?.[0]?.content?.[0]?.text`

### Styling doesn't match design system
- Check for hard-coded values
- Use CSS variable classes instead

### Dark mode colors wrong
- Missing `bg-background` or `text-foreground`
- Make sure using design system colors

---

## 💡 Pro Tips

1. **Always use semantic HTML** - Gets free styling
2. **Let the design system work** - Don't override unless needed
3. **Test dark mode** - Use design system colors
4. **Mobile-first** - Use responsive classes
5. **Verify API responses** - Check browser console

---

## 🎉 You're Ready!

- ✅ All endpoints migrated to GPT-5.1
- ✅ Design system fully implemented
- ✅ Dark mode support complete
- ✅ Mobile responsive
- ✅ Production ready

**Just remember**: Use design system variables, semantic HTML, and the new GPT-5.1 API format!
