# Design Resources Library (Apple-style IDMS)

**Read this BEFORE designing anything.**
Trusted sources for Apple-inspired light-theme design.

---

## 🍎 Visual Reference — Match this aesthetic

| Source | Why |
|---|---|
| **Apple.com** | The reference — observe spacing, type, restraint |
| **Stripe.com** | Premium B2B, similar palette, content-first |
| **Linear.app** (light mode) | Refined product UI |
| **Things 3** (Cultured Code) | Apple-style task app — perfect IDMS analog |
| **Notion** | Document-first product UI |
| **Vercel** (light mode) | Modern minimal SaaS |
| **Raycast** (light mode) | Apple-influenced productivity tool |

---

## 🥇 TIER 1 — Copy-Paste Ready Components

| Source | URL | Best for |
|---|---|---|
| **shadcn/ui** | https://ui.shadcn.com | Base components — pre-mapped to our tokens |
| **Aceternity UI** | https://ui.aceternity.com | Motion-heavy components (use selectively) |
| **Magic UI** | https://magicui.design | Animated components |
| **Origin UI** | https://originui.com | Beautiful Tailwind components (Apple-feel) |
| **HyperUI** | https://www.hyperui.dev | Free Tailwind components |
| **Tailwind UI** (paid) | https://tailwindui.com | Apple-quality components |
| **Headless UI** | https://headlessui.com | Unstyled, accessible primitives |

### Install Commands
```bash
# Base set (matches our tokens via tailwind.config.js)
npx shadcn@latest add button card dialog input form sheet dropdown-menu
npx shadcn@latest add skeleton toast tooltip avatar table tabs select
```

---

## 🥈 TIER 2 — Inspiration

| Source | URL | Use for |
|---|---|---|
| **Mobbin** | https://mobbin.com | Real product UI patterns |
| **Page Flows** | https://pageflows.com | Flow recordings from real apps |
| **Land-book** | https://land-book.com | Landing page inspiration |
| **Refero** | https://refero.design | Design inspiration by category |
| **Dribbble** | https://dribbble.com | Search: `"apple inspired dashboard"`, `"document management ui"` |
| **Godly** | https://godly.website | Modern web design |
| **Cofolios** | https://cofolios.com | Designer portfolios (Apple-style examples) |

### Effective Dribbble searches
- `"document management apple style"`
- `"saas dashboard light theme 2025"`
- `"file manager ui"`
- `"admin panel minimal"`
- `"things 3 inspired ui"`

---

## 🥉 TIER 3 — Animation Techniques

### Framer Motion (primary motion lib)
- Examples: https://www.framer.com/motion/examples/
- Docs: https://www.framer.com/motion/

### Apple-style motion references
- WWDC sessions on "Designing Fluid Interfaces"
- Things 3 micro-interactions (study them, they're textbook Apple)
- iOS spring animations: `stiffness: 300, damping: 30`

### Lottie (designer-made JSON)
- LottieFiles: https://lottiefiles.com/featured
- Use for: empty states, success animations, onboarding

### CodePen (techniques)
- https://codepen.io/search/pens
- Searches:
  - `"apple style hover"`
  - `"soft shadow card hover"`
  - `"ios spring animation"`
  - `"button press feedback"`

---

## 🎨 TIER 4 — Visual Assets

### Icons (use Lucide — already in project)
- **Lucide**: https://lucide.dev — pixel-perfect, Apple-aligned ✅
- Stroke width: `1.5` or `2`
- Size: `h-4 w-4` (16px) inline, `h-5 w-5` (20px) standalone

### Illustrations
- **unDraw** (https://undraw.co) → set color to `#0071E3` (our accent)
- **Storyset** (https://storyset.com) → soft, Apple-friendly style
- **Open Doodles** (https://www.opendoodles.com) → hand-drawn

### Fonts (already loaded)
- **DM Sans** → all UI text
- **DM Serif Display** → editorial accents only (NOT body)
- Never add a third font

### Photos (if needed for empty states / illustrations)
- **Unsplash**: https://unsplash.com — Apple-style minimal photos
- Look for: soft, light, white-space-heavy photos

---

## 📋 Approved Patterns for IDMS (Document Management)

### Hero / Landing
- **Concept:** Generous whitespace, big serif headline (DM Serif Display) + DM Sans body
- **Visual:** Subtle product screenshot in a `.surface` card with `shadow-lg`
- **Animation:** `fade-up` on mount, no autoplay video
- **Avoid:** 3D scenes, heavy gradients, glow effects

### Dashboard
- **Concept:** Grid of `.surface` stat cards + recent activity + quick actions
- **Animation:** Stagger fade-up on mount (50ms between cards)
- **Reference:** Stripe Dashboard, Linear, Things 3
- **Avoid:** Animated backgrounds, particles

### Document List
- **Concept:** Clean table OR grid of `.surface surface-hover` cards
- **Animation:** Subtle hover lift, fade on filter change
- **Reference:** Notion, Apple Files, Things 3
- **Avoid:** Heavy animations (used daily)

### Login / Auth
- **Concept:** Centered card on soft gray background
- **Visual:** Logo + form in `.surface` card + soft `shadow-lg`
- **Animation:** Single `fade-up`, focus ring on inputs (`accent-soft`)
- **Reference:** Apple ID login, Stripe login, Notion login
- **Avoid:** Split-screen with hero image (overkill for IDMS)

### Modals / Dialogs
- **Concept:** White card, `rounded-lg`, `shadow-xl`, backdrop blur
- **Animation:** `scale-in` (0.25s)
- **Reference:** shadcn Dialog (already styled correctly)

### Empty States
- **Concept:** Illustration + heading + 1-line description + 1 CTA
- **Animation:** Subtle illustration float (3s ease infinite, ±10px)
- **Reference:** Things 3 empty states, Notion

### Toasts / Notifications
- **Concept:** Bottom-right, `.surface` with `shadow-lg`, icon + text
- **Animation:** Slide in from right (0.25s), auto-dismiss 4s

---

## 🌐 When to Web-Search

Trigger when:
- A specific Apple-style pattern needed not in catalog
- Need 2025 best practices for a UI pattern
- Researching how a specific app (Things, Stripe, Linear) solved a problem

### Search Templates
- Component: `"[component name] react tailwind apple style"`
- Animation: `"[effect] framer-motion ios style"` or `"[effect] subtle hover"`
- Pattern: `"[pattern] notion ui"` or `"[pattern] things 3 ui"`
- Reference: `"document management ui dribbble"`

### Rules
1. Read 2–3 sources before deciding.
2. Prefer 2024–2025 content.
3. Synthesize clean version, never copy verbatim.
4. Always adapt to our tokens.

---

## 🚫 Sources to AVOID

- ❌ Generic Bootstrap themes (outdated)
- ❌ ThemeForest free templates (low quality)
- ❌ Material Design 3 examples (different language than ours)
- ❌ Dark-themed dashboards (we're light-only)
- ❌ Neon / cyberpunk / glassmorphism-heavy designs
- ❌ Designs with multiple bright accent colors

---

## 🎯 The Decision Flow

```
Need to build something?
  │
  ├─ Built-in utility in src/index.css? (.surface, .btn-primary, .input)
  │   → USE IT, don't recreate
  │
  ├─ Component in /design/components-catalog.md?
  │   → Reuse
  │
  ├─ Tier 1 component (shadcn/etc.)?
  │   → Install + verify it matches our tokens
  │
  ├─ Need inspiration?
  │   → Apple.com, Stripe, Things 3, Linear, Notion (Tier 2)
  │
  └─ Specific technique?
      → Framer Motion examples, Lottie, CodePen (Tier 3)
```

**Apple's rule: when in doubt, remove something.**