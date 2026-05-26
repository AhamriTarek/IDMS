# Animations Cookbook (Apple-style)

**Tested, Apple-restrained animation recipes.**
Use these as starting points. Apple motion = quick (150–400ms), purposeful, soft easing.

---

## 🎬 1. FadeUp — Apple's signature entrance

**When:** First appearance of any content. Most common animation in the app.

```tsx
// components/animated/fade-up.tsx
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeUp({ children, delay = 0, duration = 0.4 }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Or use the CSS-only version (already in `src/index.css`):**
```tsx
<div className="fade-up">Content</div>
```

---

## 🎬 2. Stagger List — items appear in sequence

**When:** Dashboard cards, document lists, feature grids on first mount.

```tsx
// components/animated/stagger-list.tsx
import { motion } from "framer-motion";
import { ReactNode } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerList({ children, className = "" }: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => <motion.div key={i} variants={item}>{child}</motion.div>)
        : <motion.div variants={item}>{children}</motion.div>}
    </motion.div>
  );
}
```

---

## 🎬 3. Apple Card Hover (CSS only)

**When:** Any clickable card. The signature lift.

**Already in `src/index.css` as `.surface-hover`** — use it:
```tsx
<div className="surface surface-hover p-lg">
  Card content
</div>
```

**The styling (for reference):**
```css
.surface-hover {
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
.surface-hover:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-mid);
  transform: translateY(-1px);
}
```

---

## 🎬 4. Page Transitions

**When:** Route changes — quick, subtle.

```tsx
// components/animated/page-transition.tsx
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 🎬 5. Animated Number (dashboard stats)

**When:** Dashboard tiles, pricing, counters. Count from 0 to value on view.

```tsx
// components/animated/animated-number.tsx
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function AnimatedNumber({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}
```

---

## 🎬 6. Button Press Feedback (Apple haptic feel)

**Already in `.btn-primary` and `.btn-secondary`.** The pattern for custom buttons:

```tsx
<button
  className="
    inline-flex items-center justify-center gap-xs
    px-lg py-sm
    bg-accent text-text-inverse
    rounded-md
    font-semibold text-small
    shadow-sm
    transition-all duration-fast ease-apple

    hover:bg-accent-hover hover:-translate-y-px hover:shadow-md
    active:scale-[0.98] active:translate-y-0
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2

    disabled:opacity-45 disabled:cursor-not-allowed
    disabled:hover:translate-y-0 disabled:hover:shadow-sm
  "
>
  Action
</button>
```

---

## 🎬 7. Modal / Dialog Entrance (Scale-in)

**When:** Modals, dialogs, popovers.

Already built into shadcn `<Dialog>`. The pattern:

```css
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.scale-in {
  animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```

With Framer Motion:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.96 }}
  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
>
  Modal content
</motion.div>
```

---

## 🎬 8. Sticky Header Glass Effect

**When:** Top app header that becomes translucent + blurred on scroll.

```tsx
// In AppHeader
import { useScrollPosition } from "@/hooks/use-scroll-position";

export function AppHeader() {
  const scrollY = useScrollPosition();
  const isScrolled = scrollY > 8;

  return (
    <header
      className={`
        sticky top-0 z-50
        transition-all duration-base ease-apple
        ${isScrolled
          ? "bg-bg-overlay backdrop-blur-xl border-b border-border"
          : "bg-transparent border-b border-transparent"
        }
      `}
    >
      {/* nav content */}
    </header>
  );
}
```

---

## 🎬 9. Toast / Notification Slide-in

**When:** Success/error notifications, system messages.

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="surface shadow-lg p-md fixed bottom-lg right-lg"
    >
      {toast.message}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🎬 10. Skeleton Loading (preferred over spinners)

**When:** Any async data loading. Apple uses skeletons, not spinners.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <div className="surface p-lg space-y-sm">
      <Skeleton className="h-3 w-16 rounded-sm" /> {/* label */}
      <Skeleton className="h-5 w-3/4 rounded-md" /> {/* title */}
      <Skeleton className="h-3 w-1/2 rounded-sm" /> {/* meta */}
      <div className="flex gap-sm pt-sm">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}
```

---

## 🎬 11. Input Focus Ring (Apple style)

**Already in `.input`.** The pattern:

```css
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft); /* the signature 3px soft ring */
  background: var(--bg-raised);
  outline: none;
}
```

**Soft accent ring = signature Apple focus state.** Use it everywhere.

---

## 🎬 12. Drawer / Sheet Slide-in

**When:** Side panels, mobile menus. Use shadcn `<Sheet>` — already styled.

The motion:
```tsx
// Sheet slide from right
initial={{ x: "100%" }}
animate={{ x: 0 }}
exit={{ x: "100%" }}
transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} // iOS spring curve
```

---

## 🎬 13. Empty State Illustration Float

**When:** Empty states with illustration.

```tsx
<motion.img
  src="/empty-state.svg"
  animate={{ y: [0, -8, 0] }}
  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
/>
```

---

## 🎬 14. Reduced Motion (mandatory)

**Already global in `src/index.css`:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**In Framer Motion:**
```tsx
import { useReducedMotion } from "framer-motion";

function Component() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      animate={shouldReduce ? {} : { y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Content
    </motion.div>
  );
}
```

---

## 🎯 Quick Pick Guide

| Want to... | Recipe |
|---|---|
| Reveal content on mount | #1 FadeUp (or `.fade-up` class) |
| Show a list with rhythm | #2 StaggerList |
| Hover lift on cards | #3 (use `.surface-hover` class) |
| Smooth route changes | #4 PageTransition |
| Animate dashboard stats | #5 AnimatedNumber |
| Button feedback | #6 (use `.btn-primary` class) |
| Modal entrance | #7 ScaleIn (built into shadcn Dialog) |
| Sticky header glass | #8 |
| Toast notifications | #9 |
| Loading states | #10 Skeleton (NOT spinners) |
| Input focus | #11 (use `.input` class) |
| Side drawer | #12 (use shadcn Sheet) |
| Empty state | #13 Illustration float |
| A11y | #14 Reduced motion |

---

## 📏 Default Timing (Apple values)

- Micro (button press, hover): **150ms** — `transition-fast` / `duration-fast`
- Component (cards, dropdowns, fades): **200–300ms** — `transition-base` / `duration-base`
- Page transitions / modals: **250–400ms** — `transition-slow` / `duration-slow`
- Idle / decorative loops: **2–4s** (subtle)

### Easing
- Default: `cubic-bezier(0.22, 1, 0.36, 1)` (out-quart, Apple-feel)
- Modal/bounce: `cubic-bezier(0.16, 1, 0.3, 1)` (out-back)
- iOS spring: `cubic-bezier(0.32, 0.72, 0, 1)` (sheets, drawers)

---

## ⚠️ Rules

1. Match Apple's restraint — quick, soft, purposeful.
2. Always replace hardcoded colors with token CSS variables.
3. Reduced motion is automatic (CSS global) — but still check Framer Motion components.
4. If a recipe doesn't fit perfectly → adapt, don't fight.
5. When in doubt, **less animation > more**.