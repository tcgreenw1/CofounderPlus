import * as kv from './kv_store.tsx';

// Seed tracks data
export async function seedTracks() {
  const tracks = [
    {
      id: 'getting-started',
      slug: 'getting-started',
      title: 'Getting Started (7-Day Launch Sprint)',
      summary: 'Launch your business in one week with validated demand and legal foundation',
      category: 'Launch',
      order_index: 1,
      tutorial_count: 3,
      estimated_hours: 8
    },
    {
      id: 'legal-finance',
      slug: 'legal-finance',
      title: 'Legal & Finance Foundations',
      summary: 'Set up proper business structure, banking, and financial systems',
      category: 'Legal & Finance',
      order_index: 2,
      tutorial_count: 2,
      estimated_hours: 4
    },
    {
      id: 'product-store',
      slug: 'product-store',
      title: 'Product & Store Setup (E-com First Sale)',
      summary: 'Create and launch your first product or online store',
      category: 'Product',
      order_index: 3,
      tutorial_count: 3,
      estimated_hours: 10
    },
    {
      id: 'marketing-jumpstart',
      slug: 'marketing-jumpstart',
      title: 'Marketing Jumpstart (30 Days)',
      summary: 'Build your marketing foundation and get your first customers',
      category: 'Marketing',
      order_index: 4,
      tutorial_count: 3,
      estimated_hours: 6
    },
    {
      id: 'b2b-sales',
      slug: 'b2b-sales',
      title: 'B2B Sales Starter',
      summary: 'Master business-to-business sales and close your first deals',
      category: 'Sales',
      order_index: 5,
      tutorial_count: 2,
      estimated_hours: 4
    }
  ];

  for (const track of tracks) {
    await kv.set(`university:track:${track.slug}`, track);
  }
}

// Seed tutorials data with full content
export async function seedTutorials() {
  const tutorials = [
    // Getting Started Track
    {
      id: 'market-validation-sprint',
      slug: 'market-validation-sprint',
      title: 'The 48-Hour Market Validation Sprint',
      summary: 'Validate demand in two days using landing page + traffic smoke test.',
      est_minutes: 120,
      difficulty: 'Beginner',
      category: 'Launch',
      tags: ['validation', 'landing-page', 'market-research'],
      track_slug: 'getting-started',
      order_index: 1,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'form-llc-smart-way',
      slug: 'form-llc-smart-way',
      title: 'Form Your LLC (US) the Smart Way',
      summary: 'State selection, EIN, operating agreement, registered agent, compliance calendar.',
      est_minutes: 75,
      difficulty: 'Beginner',
      category: 'Legal & Finance',
      tags: ['llc', 'legal', 'compliance'],
      track_slug: 'getting-started',
      order_index: 2,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'business-banking-quickstart',
      slug: 'business-banking-quickstart',
      title: 'Business Banking & Bookkeeping Quickstart',
      summary: 'Bank account setup; connect feeds; chart of accounts; monthly close checklist.',
      est_minutes: 60,
      difficulty: 'Beginner',
      category: 'Legal & Finance',
      tags: ['banking', 'bookkeeping', 'accounting'],
      track_slug: 'legal-finance',
      order_index: 1,
      prerequisites: ['form-llc-smart-way'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Product & Store Track
    {
      id: 'shopify-first-sale',
      slug: 'shopify-first-sale',
      title: 'Shopify First Sale Setup (Half-day)',
      summary: 'Theme choice; product page template; shipping policy; taxes; payments; test order.',
      est_minutes: 180,
      difficulty: 'Beginner',
      category: 'Product',
      tags: ['shopify', 'ecommerce', 'store-setup'],
      track_slug: 'product-store',
      order_index: 1,
      prerequisites: ['business-banking-quickstart'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'print-on-demand-mvp',
      slug: 'print-on-demand-mvp',
      title: 'Print-on-Demand MVP in a Weekend',
      summary: 'Choose niche; create 6 designs; connect POD app; price test; 10-order goal.',
      est_minutes: 120,
      difficulty: 'Beginner',
      category: 'Product',
      tags: ['print-on-demand', 'mvp', 'design'],
      track_slug: 'product-store',
      order_index: 2,
      prerequisites: ['shopify-first-sale'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'supplier-sourcing-101',
      slug: 'supplier-sourcing-101',
      title: 'Supplier Sourcing 101 (Alibaba + Alternatives)',
      summary: 'RFQ template; MOQ negotiation; sample process; quality SOP.',
      est_minutes: 120,
      difficulty: 'Intermediate',
      category: 'Product',
      tags: ['suppliers', 'alibaba', 'sourcing'],
      track_slug: 'product-store',
      order_index: 3,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Marketing Track
    {
      id: 'first-200-ads-test',
      slug: 'first-200-ads-test',
      title: 'First $200 Ads Test (Meta or TikTok)',
      summary: 'Install pixel/SDK; create 3 hooks × 2 creatives; campaign structure; KPIs.',
      est_minutes: 90,
      difficulty: 'Beginner',
      category: 'Marketing',
      tags: ['ads', 'meta', 'tiktok', 'testing'],
      track_slug: 'marketing-jumpstart',
      order_index: 1,
      prerequisites: ['shopify-first-sale'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'email-marketing-quickstart',
      slug: 'email-marketing-quickstart',
      title: 'Email Marketing Quickstart (Klaviyo/Mailchimp)',
      summary: 'List setup, forms; flows: Welcome, Abandoned Cart, Post-Purchase; basic segmentation.',
      est_minutes: 75,
      difficulty: 'Beginner',
      category: 'Marketing',
      tags: ['email', 'klaviyo', 'mailchimp', 'automation'],
      track_slug: 'marketing-jumpstart',
      order_index: 2,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'seo-30-days',
      slug: 'seo-30-days',
      title: 'SEO in 30 Days',
      summary: 'Topic map; 10-page structure; on-page SEO; internal links; simple backlinks.',
      est_minutes: 60,
      difficulty: 'Beginner',
      category: 'Marketing',
      tags: ['seo', 'content', 'backlinks'],
      track_slug: 'marketing-jumpstart',
      order_index: 3,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // B2B Sales Track
    {
      id: 'b2b-cold-outreach',
      slug: 'b2b-cold-outreach',
      title: 'B2B Cold Outreach Starter (Apollo + Inbox Warmer)',
      summary: 'ICP definition; list build; 2-step personalization; sending infra; daily 50-100 emails.',
      est_minutes: 120,
      difficulty: 'Intermediate',
      category: 'Sales',
      tags: ['outreach', 'apollo', 'b2b', 'email'],
      track_slug: 'b2b-sales',
      order_index: 1,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'discovery-calls-convert',
      slug: 'discovery-calls-convert',
      title: 'Discovery Calls that Convert',
      summary: 'Agenda, SPIN-style questions, objection bank, next steps email.',
      est_minutes: 60,
      difficulty: 'Beginner',
      category: 'Sales',
      tags: ['sales-calls', 'discovery', 'conversion'],
      track_slug: 'b2b-sales',
      order_index: 2,
      prerequisites: ['b2b-cold-outreach'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Operations Track
    {
      id: 'sops-that-scale',
      slug: 'sops-that-scale',
      title: 'SOPs that Scale (Write Once, Use Forever)',
      summary: 'Choose process; record loom; convert to checklist; assign owner; review cadence.',
      est_minutes: 50,
      difficulty: 'Beginner',
      category: 'Operations',
      tags: ['sops', 'processes', 'scaling'],
      track_slug: 'getting-started',
      order_index: 3,
      prerequisites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const tutorial of tutorials) {
    await kv.set(`university:tutorial:${tutorial.slug}`, tutorial);
  }
}

// Seed tutorial lessons (detailed content)
export async function seedLessons() {
  const lessons = [
    // Market Validation Sprint - Complete Tutorial
    {
      id: 'mvs-lesson-1',
      tutorial_slug: 'market-validation-sprint',
      title: 'Complete Market Validation Sprint',
      order_index: 1,
      content_md: `
# The 48-Hour Market Validation Sprint

## Why this matters

Building the wrong thing burns time and cash. This sprint forces reality: a tight offer, a one-page site, and a small stream of targeted visitors. If strangers opt in, you have a signal. If they don't, you iterate before you waste weeks.

## Prerequisites

- A niche idea or problem you can describe in 1–2 sentences
- Domain or subdomain available (optional)
- $50–$150 for traffic (ads or directory boosts)

## Time & Cost

- Time: ~2–4 hours of focused work over 2 days
- Cost: $50–$150 test budget

## Steps (Checklist)

1. Write 3 problem statements for your niche (who, pain, outcome). Pick the sharpest.
2. Draft a value prop: headline + 3 bullets. Rule: specific, outcome‑oriented, no fluff.
3. Assemble social proof (even light: numbers, screenshot, testimonial seed, founder story).
4. Build a 1‑page site (Framer template or Cofounder landing kit). Include: headline, bullets, visual, CTA form.
5. Instrument analytics: pageview + lead event (GA4 + Meta/TikTok pixel). Verify events fire.
6. Create a lead magnet (mini guide/checklist) or promise of early‑bird pricing.
7. Set a goal: ≥3% lead conversion or ≥10 qualified signups in 48 hours.
8. Traffic plan A: $10–$25/day ads to your exact audience (2 hooks × 2 creatives). Geo = top 3 markets.
9. Traffic plan B (free/cheap): post in 1 directory + 1 subreddit + 1 FB group (value‑first post). No spam.
10. Launch traffic. Start a tracking sheet (impressions, clicks, CPC, CTR, CVR, CPL).
11. After 100–200 visits, read the data. If CVR < 1%, iterate copy/creative. If CTR < 0.5%, fix hooks.
12. Send a 3‑question email to signups: (a) biggest pain? (b) current workaround? (c) what would you pay?
13. Book 5–10 customer calls (15 min). Record pain, language, willingness to pay.
14. Decide: Proceed / Pivot / Kill. Save notes in Cofounder and update roadmap.

## Templates & Resources

- Landing Page Copy Template (DOC)
- Tracking Sheet (Sheet)
- 3‑Question Interview Email (DOC)

## Next actions

- Open Playbook → /playbooks/launch-sprint
- Start Task → Interview 10 leads
      `
    },
    
    // LLC Formation - Complete Tutorial
    {
      id: 'llc-lesson-1',
      tutorial_slug: 'form-llc-smart-way',
      title: 'Complete LLC Formation Guide',
      order_index: 1,
      content_md: `
# Form Your LLC (US) the Smart Way

## Why this matters

Legal structure protects your personal assets and creates professional credibility. Getting this right from the start saves thousands in restructuring costs later.

## Prerequisites

- Pick state (home vs Delaware/Wyoming; pros/cons)
- Payment method ready
- Business name idea

## Time & Cost

- Time: 60–90 minutes
- Cost: $0–$300+ state fees

## Steps (Checklist)

1. **Choose state** (home vs Delaware/Wyoming; pros/cons).
   - **Home State**: Familiar laws, easier local handling, no foreign qualification
   - **Delaware**: Business courts, privacy, investment-friendly
   - **Wyoming**: Lowest fees, tax benefits, strong privacy
2. **Name search + availability** - Check state database for conflicts
3. **File Articles** - Submit through state portal (links provided for all 50 states)
4. **Get EIN** - Apply online at IRS.gov (takes 5-15 minutes)
5. **Operating Agreement** - Use template, customize for your situation
6. **Open business bank account** - Gather: EIN, Articles, Operating Agreement, ID
7. **Compliance setup** - Set annual report reminders, registered agent if needed

## State Selection Guide

### Choose Home State If:
- Starting out / bootstrapping
- Local business model
- Want simplicity
- Annual fees under $500

### Choose Delaware If:
- Planning to raise investment
- Multiple founders/investors
- Need legal precedent strength
- Privacy is important

### Choose Wyoming If:
- Want lowest possible costs
- Maximum privacy protection
- No investment plans
- Simple ownership structure

## Next actions

- Open Playbook → /playbooks/legal-setup
- Start Task → Open business bank account
      `
    },
    
    // Business Banking - Complete Tutorial
    {
      id: 'banking-lesson-1',
      tutorial_slug: 'business-banking-quickstart',
      title: 'Complete Banking & Bookkeeping Setup',
      order_index: 1,
      content_md: `
# Business Banking & Bookkeeping Quickstart

## Why this matters

Clean finances = better decisions, easier taxes, and investor‑ready ops. You'll connect accounts, set a simple chart, and define a monthly close ritual.

## Prerequisites

- LLC or sole prop details; EIN if applicable
- Access to at least one business bank/credit account

## Time & Cost

- Time: 60 minutes + 30 minutes/month
- Cost: $0–$30/month (Wave free, QuickBooks often discounted)

## Steps (Checklist)

1. **Open a business checking** - gather documents (EIN, Articles, ID)
2. **Create your accounting tool** (Wave or QuickBooks)
3. **Connect bank/credit feeds** - backfill 90 days if available
4. **Import COA template** (simple revenue, COGS, Opex buckets)
5. **Create rules** for common vendors (e.g., Stripe → Sales; USPS → Shipping)
6. **Turn on receipt capture** (mobile app, email‑to‑inbox)
7. **Reconcile current month** - fix uncategorized transactions
8. **Build a Monthly Close SOP** (checklist + calendar reminder)
9. **Add basic dashboard** - cash balance, M/M revenue, gross margin, burn
10. **Share viewer access** with your tax pro/bookkeeper if needed

## Chart of Accounts Setup

### Revenue Accounts
- Sales Revenue
- Service Revenue  
- Interest Income
- Other Income

### Cost of Goods Sold
- Product Costs
- Shipping Costs
- Payment Processing Fees

### Operating Expenses
- Marketing & Advertising
- Office Supplies
- Software Subscriptions
- Professional Services
- Travel & Meals

## Monthly Close Checklist

1. Reconcile all bank/credit accounts
2. Categorize all transactions
3. Review P&L for anomalies
4. Update cash flow projections
5. Export reports for stakeholders
6. Set goals for next month

## Next actions

- Open Playbook → /playbooks/finance-foundations
- Start Task → Reconcile last month
      `
    },
    
    // Shopify Setup - Complete Tutorial
    {
      id: 'shopify-lesson-1',
      tutorial_slug: 'shopify-first-sale',
      title: 'Complete Shopify Store Setup',
      order_index: 1,
      content_md: `
# Shopify First Sale Setup (Half-Day)

## Why this matters

A messy store kills trust. This gets you live fast with clean product pages, compliant policies, working payments, and a test order so you can start selling today.

## Prerequisites

- Product idea and price range
- Brand name, logo (placeholder OK), basic images

## Time & Cost

- Time: ~3 hours
- Cost: Shopify plan + $0–$50 for a paid theme (optional)

## Steps (Checklist)

1. **Create store** - choose a fast, simple theme (Dawn or similar)
2. **Configure payments** (Shopify Payments/Stripe) and test mode
3. **Add 1–3 products** with consistent titles, benefit‑led bullets, 4+ images, and FAQs
4. **Write policies** - shipping, returns, privacy, terms (use policy generator, edit)
5. **Set shipping** - simple flat rate + free over threshold; verify zones
6. **Configure taxes** and locations
7. **Install analytics** - GA4 + Meta/TikTok Pixel. Verify events: view content, add to cart, checkout, purchase (test mode)
8. **Build Home, Product, Cart/Checkout basics** - Remove filler sections
9. **Add trust badges** (payments, SSL) and contact info
10. **Create launch checklist page** inside Cofounder and link to it from your store owner notes
11. **Place a test order** (discount to $1 or test gateway). Confirm emails and fulfillment flow
12. **Go live** - Announce to warm audience (email, IG, friends) and set up post‑purchase survey

## Product Page Optimization

### Essential Elements:
- Clear product title with main benefit
- High-quality hero image
- 3-5 additional product images
- Benefit-focused bullet points (not just features)
- Social proof (reviews, testimonials)
- Clear pricing and shipping info
- Prominent "Add to Cart" button
- FAQ section addressing common objections

### Trust Signals:
- Money-back guarantee
- Secure payment badges
- Customer reviews
- Contact information
- About Us page
- Professional product photography

## Next actions

- Open Playbook → /playbooks/ecom-first-sale
- Start Task → Collect 10 reviews
      `
    },
    
    // Print on Demand - Complete Tutorial
    {
      id: 'pod-lesson-1',
      tutorial_slug: 'print-on-demand-mvp',
      title: 'Complete Print-on-Demand Setup',
      order_index: 1,
      content_md: `
# Print-on-Demand MVP in a Weekend

## Why this matters

POD lets you test product ideas with zero inventory risk. Create designs, connect fulfillment, and validate demand before investing in stock.

## Prerequisites

- Shopify store setup complete
- Design ideas or niche identified
- Basic design skills (Canva/Figma) or budget for designer

## Time & Cost

- Time: 2 days (120 minutes focused work)
- Cost: $0–$50 for design tools/assets

## Steps (Checklist)

1. **Choose niche** - Research trending topics, passionate communities, underserved markets
2. **Create 6 designs** - Use Canva templates, focus on text-based designs first
3. **Connect POD app** - Printful, Printify, or Gooten integration
4. **Set up products** - T-shirts, mugs, phone cases (start with 2-3 product types)
5. **Price test** - Research competitor pricing, aim for 40-60% profit margins
6. **Upload and sync** - Connect designs to products, set up automatic fulfillment
7. **Create collections** - Organize products by theme/audience
8. **Set 10-order goal** - Track first sales to validate demand
9. **Launch marketing** - Social media, relevant Facebook groups, Pinterest
10. **Analyze performance** - Track which designs sell, customer feedback, profit margins

## Design Strategy

### High-Converting Design Types:
- Text-based quotes (motivational, funny, niche-specific)
- Simple graphics with bold messages
- Trending topics/memes (be quick to market)
- Niche community inside jokes
- Seasonal/holiday themes

### Design Best Practices:
- Keep text readable at small sizes
- Use high contrast colors
- Test designs on actual products
- Create variations of winning designs
- Focus on emotional connection

## Pricing Formula

**Base Cost + Shopify Fees + Profit Margin = Sale Price**

Example:
- Printful T-shirt: $11.50
- Shopify fees (3%): $0.75
- Your profit: $12.75
- **Sale Price: $25.00**

## Next actions

- Open Playbook → /playbooks/pod-scaling
- Start Task → Create 20 more designs
      `
    },
    
    // Ads Test - Complete Tutorial
    {
      id: 'ads-lesson-1',
      tutorial_slug: 'first-200-ads-test',
      title: 'Complete $200 Ads Test Setup',
      order_index: 1,
      content_md: `
# First $200 Ads Test (Meta or TikTok)

## Why this matters

Small, structured spend beats big, sloppy budgets. This test finds a winning hook/creative quickly—or tells you to fix the offer before scaling.

## Prerequisites

- Pixel/SDK installed and verified (view, add‑to‑cart, purchase)
- At least one product/offer live (or lead magnet)

## Time & Cost

- Time: 90 minutes setup, daily 10‑minute checks
- Cost: $200 total

## Steps (Checklist)

1. **Define success** - for e‑com, target CPA ≤ 30–40% of AOV; for leads, CPL target
2. **Draft 3 hooks and 2 creatives each** (UGC style if possible). Keep 15s clips tight
3. **Build one campaign** with ad set per audience (broad + interest). No fancy structure
4. **Daily budget** - $20–$40 total; run 3–5 days
5. **Ensure correct attribution window** (7‑day click for Meta; TikTok default OK for test)
6. **Launch** - Check delivery and event firing after 1 hour
7. **Day 1–2** - watch CTR (≥1%), CPC, ATC rate, early CPR/CPL signals
8. **Kill any ad** with bottom‑quartile CTR after 500–1,000 impressions
9. **Promote any ad** with top CTR + lowest CPC; duplicate to another audience
10. **Day 3–5** - evaluate CPA/CPL vs target. If no path to target, pause and fix offer/landing
11. **Document learnings** in Cofounder: top hook lines, frames, objections

## Creative Strategy

### Hook Formulas That Work:
- Problem/Solution: "Tired of X? Here's how I solved it..."
- Social Proof: "This got 50K views because..."
- Curiosity Gap: "The thing nobody tells you about X..."
- Pattern Interrupt: "Stop doing X. Do this instead..."
- Before/After: "I went from X to Y in Z days..."

### Creative Types to Test:
- User-generated content style
- Screen recordings (for software/digital)
- Before/after transformations
- Behind-the-scenes content
- Customer testimonials

## Success Metrics

### Meta Benchmarks:
- CTR: >1% (good), >2% (excellent)
- CPC: <$1.00 (most niches)
- Video View Rate: >25%
- Cost Per Lead: <$10 (B2B), <$5 (B2C)

### TikTok Benchmarks:
- CTR: >1.5%
- CPC: <$0.80
- Video Completion Rate: >20%
- CPM: <$10

## Next actions

- Open Playbook → /playbooks/paid-creative-testing
- Start Task → Shoot 5 new UGC variations
      `
    }
  ];

  for (const lesson of lessons) {
    await kv.set(`university:lesson:${lesson.tutorial_slug}:${lesson.id}`, lesson);
  }
}

// Seed tutorial assets (templates, downloads)
export async function seedAssets() {
  const assets = [
    {
      id: 'mvs-landing-template',
      tutorial_slug: 'market-validation-sprint',
      title: 'Landing Page Copy Template',
      type: 'template',
      url: '/templates/landing-page-template.pdf',
      description: 'Fill-in-the-blank template for your validation landing page'
    },
    {
      id: 'mvs-tracking-sheet',
      tutorial_slug: 'market-validation-sprint',
      title: 'Validation Tracking Sheet',
      type: 'sheet',
      url: '/templates/validation-tracking.xlsx',
      description: 'Spreadsheet to track your traffic, conversions, and feedback'
    },
    {
      id: 'llc-operating-agreement',
      tutorial_slug: 'form-llc-smart-way',
      title: 'Single-Member LLC Operating Agreement',
      type: 'template',
      url: '/templates/llc-operating-agreement.pdf',
      description: 'Legal template for single-member LLC operating agreement'
    },
    {
      id: 'llc-compliance-checklist',
      tutorial_slug: 'form-llc-smart-way',
      title: 'Annual Compliance Checklist',
      type: 'pdf',
      url: '/templates/llc-compliance-checklist.pdf',
      description: 'Year-round checklist to stay compliant with state requirements'
    },
    {
      id: 'banking-chart-accounts',
      tutorial_slug: 'business-banking-quickstart',
      title: 'Chart of Accounts Template',
      type: 'sheet',
      url: '/templates/chart-of-accounts.xlsx',
      description: 'Pre-built chart of accounts for small businesses'
    },
    {
      id: 'monthly-close-sop',
      tutorial_slug: 'business-banking-quickstart',
      title: 'Monthly Close SOP',
      type: 'template',
      url: '/templates/monthly-close-sop.pdf',
      description: 'Step-by-step process for closing your books each month'
    }
  ];

  for (const asset of assets) {
    await kv.set(`university:asset:${asset.tutorial_slug}:${asset.id}`, asset);
  }
}

// Main seeding function
export async function seedUniversityData() {
  console.log('🌱 Seeding university data...');
  
  try {
    await seedTracks();
    console.log('✅ Tracks seeded');
    
    await seedTutorials();
    console.log('✅ Tutorials seeded');
    
    await seedLessons();
    console.log('✅ Lessons seeded');
    
    await seedAssets();
    console.log('✅ Assets seeded');
    
    console.log('🎉 University data seeding complete!');
    return { success: true, message: 'All university data seeded successfully' };
    
  } catch (error) {
    console.error('❌ Error seeding university data:', error);
    return { success: false, error: error.message };
  }
}