# ADHD Budget Planner — Etsy Listing & Post-Production Playbook

## Etsy Listing Checklist

### Title (optimise for Etsy SEO — max 140 chars)
```
ADHD Budget Planner App | Paycheck Budget Tracker, Debt Payoff, Impulse Vault | Offline PWA, No Subscription, Calm Dashboard
```

### Tags (13 max — use all)
```
adhd budget planner, budget planner app, paycheck budget, debt payoff planner, adhd money tool,
offline budget app, neurodivergent budget, impulse spending, calm budget dashboard,
no subscription budget, digital budget planner, adhd finance tool, sinking fund planner
```

### Price Strategy
| Tier | Price | Rationale |
|------|-------|-----------|
| Launch Price | $9.00 | Build reviews quickly (25+ reviews target) |
| Standard Price | $14.00 | Value pricing post-review social proof |
| Bundle with Printable | $17.00 | Add a printable ADHD expense tracker PDF |

### Thumbnail Image Strategy (5 images required)
1. **Hero mockup**: Phone showing "Safe to Spend Today = $34.82" on Sage Calm theme
2. **Feature grid**: 4 screenshots — Impulse Vault, Zombie Mode, Debt Crusher, Planner Calendar
3. **Multi-device**: iPhone + MacBook side by side with the same open app
4. **4 Themes**: Side-by-side of Sage Calm / OLED Dark / Warm Earth / High Contrast
5. **Setup Steps**: Visual iOS/Android add-to-home-screen instructions (3 steps)

---

## Fulfillment Package (What Customer Receives in Etsy Download)

```
ADHD-Budget-Planner-Download.zip
  ├── CUSTOMER-GUIDE.pdf        (designed PDF version of the MD guide)
  ├── START-HERE.pdf            (1-page quick reference card)
  ├── app-link.txt              (the hosted PWA URL)
  ├── offline-backup/
  │     └── index.html          (standalone offline version, no server needed)
  └── bonus/
        └── ADHD-Expense-Tracker.pdf   (printable bonus PDF)
```

### Delivery Automation
- Use **Etsy's digital download** system to attach the ZIP
- No manual work per order — fully automated delivery

---

## Hosting Options (Ranked by Simplicity)

| Option | Cost | Effort | Best For |
|--------|------|--------|----------|
| **GitHub Pages** | Free | Low — push to repo | Developer-comfortable sellers |
| **Cloudflare Pages** | Free | Low — connect GitHub | Best CDN performance, global edge |
| **Netlify** | Free tier | Low — drag & drop | Non-technical sellers |
| **Custom domain** | ~$12/year | Medium | Branding (e.g. adhdbudget.app) |

**Recommended:** Cloudflare Pages + GitHub repo → auto-deploys every push → zero downtime updates.

### Deploy Steps (GitHub Pages)
```bash
cd "d:\My Projects\Etsy Digital Tools"
git init
git add .
git commit -m "Initial ADHD Budget Planner release"
git remote add origin https://github.com/YOUR-USERNAME/adhd-budget-planner.git
git push -u origin main
# Then: GitHub repo Settings → Pages → Deploy from main branch → root /
```

---

## Post-Launch Growth Checklist

- [ ] Record a 5-min walkthrough video (Loom or OBS) — upload to YouTube unlisted or Etsy video
- [ ] Create a TikTok/Reels clip: "I built a budget app for ADHD brains and here's why it's different"
- [ ] Post to Reddit: r/ynab, r/personalfinance, r/ADHD, r/adhdwomen — share the free demo link
- [ ] Pinterest: Create 3 vertical pins showing the Zombie Mode, Impulse Vault, and Safe to Spend
- [ ] Email list: Offer the demo link free on a landing page — capture emails for future products

---

## Version Update Workflow

When you improve the app:
1. Edit files in `d:\My Projects\Etsy Digital Tools`
2. Bump cache version in `sw.js`: `const CACHE_NAME = 'adhd-budget-planner-v1.1.6';`
3. `git add . && git commit -m "v1.0.1: [describe change]" && git push`
4. Cloudflare/GitHub auto-deploys in ~60 seconds
5. All customers automatically get the update next time they open the app — **zero customer action needed**

---

## Legal & Copyright Notes

- All code is clean-room original (no copied code from competitors)
- The Etsy listing description should include: *"For personal use on your devices. Not for redistribution."*
- Your app name, theme names, feature names (Impulse Vault™, Zombie Mode™, Oops Fund™) can be trademarked
- Etsy's digital download policy is satisfied: instant download, no physical item, no DRM required
