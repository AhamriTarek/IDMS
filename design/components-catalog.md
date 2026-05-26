# Components Catalog (Apple-style IDMS)

**Read BEFORE creating any new component.**
This is the inventory of every reusable building block. Reuse first, build only when nothing fits.

---

## 📐 Folder Structure

```
src/
├── components/
│   ├── ui/              ← shadcn base (themed to Apple tokens)
│   ├── shared/          ← custom reusable components
│   ├── animated/        ← motion components (Framer Motion)
│   └── layout/          ← Header, Sidebar, Footer, PageWrapper
├── pages/               ← Route-level pages
└── hooks/               ← Custom React hooks
```

---

## 🧰 BUILT-IN UTILITY CLASSES (src/index.css)

**Use these BEFORE reaching for components.** They're already styled to match Apple tokens.

| Class | What it does |
|---|---|
| `.surface` | White card, soft border, `shadow-sm`, `rounded-lg` |
| `.surface-hover` | Add to `.surface` → hover lift + shadow expand |
| `.btn-primary` | Apple-blue primary button (full styling) |
| `.btn-secondary` | White outlined button (full styling) |
| `.input` | Standard text input (full styling, focus ring) |
| `.badge` | Base pill badge |
| `.badge-green` / `-amber` / `-red` / `-blue` / `-gray` | Status badges |
| `.label` | 11px uppercase tracked label (gray) |
| `.fade-up` | Quick fade-in-up animation |

### Usage
```tsx
<div className="surface surface-hover p-lg">
  <span className="label">Status</span>
  <h3 className="text-h3 mt-sm">Title</h3>
  <button className="btn-primary mt-md">Action</button>
</div>
```

---

## 🧱 BASE COMPONENTS (shadcn/ui)

All themed to our Apple tokens via `tailwind.config.js`. Use them everywhere.

| Component | Path | Use for |
|---|---|---|
| Button | `components/ui/button.tsx` | All actions (or use `.btn-primary` / `.btn-secondary` for static buttons) |
| Card | `components/ui/card.tsx` | Content containers |
| Dialog | `components/ui/dialog.tsx` | Modals, confirmations |
| Input | `components/ui/input.tsx` | Form inputs (or `.input` class for non-form inputs) |
| Form | `components/ui/form.tsx` | Form wrapper + validation |
| Select | `components/ui/select.tsx` | Dropdowns |
| Sheet | `components/ui/sheet.tsx` | Slide-in side panels |
| Dropdown Menu | `components/ui/dropdown-menu.tsx` | Action menus |
| Table | `components/ui/table.tsx` | Data tables |
| Tabs | `components/ui/tabs.tsx` | Tabbed navigation |
| Badge | `components/ui/badge.tsx` | Status indicators (or use `.badge-*` classes) |
| Avatar | `components/ui/avatar.tsx` | User profile images |
| Tooltip | `components/ui/tooltip.tsx` | Hover hints |
| Toast | `components/ui/toast.tsx` | Notifications |
| Skeleton | `components/ui/skeleton.tsx` | Loading placeholders |

**Add with:** `npx shadcn@latest add <name>`

---

## ✨ ANIMATED COMPONENTS (custom)

Subtle, Apple-style motion. Use sparingly — only where it adds clarity.

| Component | Path | What it does |
|---|---|---|
| `FadeUp` | `components/animated/fade-up.tsx` | Mount fade + translateY(16px) |
| `StaggerList` | `components/animated/stagger-list.tsx` | Children appear with 50ms stagger |
| `AnimatedNumber` | `components/animated/animated-number.tsx` | Counts from 0 to value on view |
| `ScaleIn` | `components/animated/scale-in.tsx` | Modal-style entrance (scale 0.96 → 1) |
| `PageTransition` | `components/animated/page-transition.tsx` | Route change wrapper |

### Usage
```tsx
<FadeUp delay={0.1}>
  <h1 className="text-h1">Welcome</h1>
</FadeUp>

<StaggerList>
  {items.map(i => <Card key={i.id}>{i.title}</Card>)}
</StaggerList>

<AnimatedNumber value={1234} suffix=" docs" />
```

---

## 🎛️ DASHBOARD COMPONENTS

| Component | Path | Use for |
|---|---|---|
| `StatCard` | `components/dashboard/StatCard.jsx` | Dashboard stat tile — compact (~140px), top-left gradient icon badge (44×44, radius 12), 36px number, 14px label, 12px subtitle. Hover: translateY(-2px) + shadow-md + icon scale 1.05. Props: `icon` (Lucide component), `label`, `sub`, `stat`, `gradient`, `iconShadowColor`, `delay`, `to` |
| `ElevatedCard` (inline) | inside `pages/AdminDashboard.jsx` | Chart/table card wrapper with inner highlight + layered shadow |

---

## 🧩 LAYOUT COMPONENTS

| Component | Path | Use for |
|---|---|---|
| `AppHeader` | `components/layout/app-header.tsx` | Top nav (sticky, `bg-overlay` glass effect) |
| `AppSidebar` | `components/layout/app-sidebar.tsx` | Left nav for dashboard |
| `AuthLayout` | `components/layout/auth-layout.tsx` | Centered card on soft gray bg |
| `DashboardLayout` | `components/layout/dashboard-layout.tsx` | Header + sidebar + content |
| `PageWrapper` | `components/layout/page-wrapper.tsx` | Page container with consistent padding |
| `Container` | `components/layout/container.tsx` | `max-w-7xl mx-auto px-md` |

---

## 🔧 SHARED COMPONENTS

| Component | Path | Use for |
|---|---|---|
| `Logo` | `components/shared/logo.tsx` | Brand mark (variants: full, icon) |
| `UserMenu` | `components/shared/user-menu.tsx` | Avatar + dropdown |
| `SearchBar` | `components/shared/search-bar.tsx` | Global search (Apple-style spotlight) |
| `DataTable` | `components/shared/data-table.tsx` | Sortable, filterable table |
| `Pagination` | `components/shared/pagination.tsx` | Page navigation |
| `FileUpload` | `components/shared/file-upload.tsx` | Drag-and-drop upload |
| `FilePreview` | `components/shared/file-preview.tsx` | Preview for documents/images |
| `StatCard` | `components/shared/stat-card.tsx` | Dashboard metric (`.surface` + AnimatedNumber) |
| `ConfirmDialog` | `components/shared/confirm-dialog.tsx` | "Are you sure?" prompt |
| `EmptyState` | `components/shared/empty-state.tsx` | Illustration + message + CTA |
| `ErrorState` | `components/shared/error-state.tsx` | Error display + retry |
| `LoadingState` | `components/shared/loading-state.tsx` | Full-page loading (skeletons preferred) |
| `Breadcrumb` | `components/shared/breadcrumb.tsx` | Nested page nav |
| `PageHeader` | `components/shared/page-header.tsx` | Title + description + actions row |

---

## 🪝 CUSTOM HOOKS

| Hook | Path | What it does |
|---|---|---|
| `useAuth` | `hooks/use-auth.ts` | Auth state + login/logout |
| `useDebounce` | `hooks/use-debounce.ts` | Debounce a value |
| `useMediaQuery` | `hooks/use-media-query.ts` | Detect screen size |
| `useScrollPosition` | `hooks/use-scroll-position.ts` | Track scroll Y (for sticky header glass) |
| `useIntersection` | `hooks/use-intersection.ts` | Detect element in viewport |
| `useReducedMotion` | `hooks/use-reduced-motion.ts` | Respect `prefers-reduced-motion` |
| `useClickOutside` | `hooks/use-click-outside.ts` | Close dropdowns on outside click |
| `useKeyPress` | `hooks/use-key-press.ts` | Listen to key combos (⌘K for search) |

---

## 📝 RULES FOR ADDING NEW COMPONENTS

1. **Check this catalog first.** Does something similar already exist?
2. **Check `src/index.css` utilities.** Maybe `.surface` + a few tokens are enough.
3. **Pick the right folder:**
   - `ui/` → only shadcn base
   - `shared/` → reusable across pages
   - `animated/` → motion-focused
   - `layout/` → page structure
4. **Use tokens** only — no hardcoded values.
5. **All 5 states**: default, hover, focus, active, disabled.
6. **All 4 data states** if async: loading, empty, error, success.
7. **Add it to this catalog** with path + description.
8. **Export from folder's `index.ts`** for clean imports.

---

## ⚠️ ANTI-PATTERNS

- ❌ Creating `<MyButton>` when `.btn-primary` or `<Button>` exists
- ❌ Creating `<MyCard>` when `.surface` is one className
- ❌ Hardcoding `#0071E3` instead of using `bg-accent`
- ❌ Using `border-gray-200` instead of `border-border`
- ❌ Building a custom modal instead of shadcn `<Dialog>`
- ❌ Multiple button styles across pages
- ❌ Forgetting to add new components here after creating them

---

## 🔍 Quick Lookup

| Need | Use |
|---|---|
| Container card | `.surface` |
| Hoverable card | `.surface surface-hover` |
| Primary button | `.btn-primary` or `<Button>` |
| Secondary button | `.btn-secondary` or `<Button variant="outline">` |
| Text input | `.input` or `<Input>` |
| Confirmation | `<ConfirmDialog>` |
| No results | `<EmptyState>` |
| Loading | `<Skeleton>` (NOT spinner) |
| Status pill | `.badge .badge-green` etc. |
| Section label | `.label` |
| Fade in on mount | `.fade-up` class OR `<FadeUp>` component |
| List entrance | `<StaggerList>` |
| Animated stat | `<AnimatedNumber>` |
| Page entrance | `<PageTransition>` |
| Stat tile | `<StatCard>` |
| Upload file | `<FileUpload>` |

> **If you're writing `<div className="bg-white border ...">` for the 3rd time — use `.surface` and add a component to this catalog.**