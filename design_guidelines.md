# ManisBizz Design Guidelines

## Design Approach
**Hybrid Approach**: Combining utility-focused business management with warm, dessert-themed aesthetics. The interface prioritizes mobile-first functionality while maintaining an approachable, sweet visual identity that reflects the dessert vendor business.

**Reference Inspiration**: Drawing from Notion (clean data organization) + Airbnb (warm, inviting interface) + modern POS systems, adapted with dessert-themed personality.

---

## Core Design Elements

### A. Color Palette

**Light Mode (Primary) - Sophisticated Warm Neutrals**
- Background Primary: 35 12% 97% (warm cream)
- Card Background: 35 25% 95% (soft beige)
- Primary Brand: 38 58% 58% (warm terracotta) - unified warm hue
- Accent: 42 65% 58% (warm gold) - for highlights and premium features
- Text Primary: 30 30% 18% (rich chocolate brown)
- Text Secondary: 30 15% 42% (soft brown)
- Success: 145 52% 48% (for paid/completed status)
- Warning: 28 68% 56% (for pending status)
- Danger: 355 70% 55% (for rejected/expired)
- Border: 35 15% 86% (subtle warm border)
- All primary surfaces: hues 28-42 (fully warm-neutral cohesive)

**Dark Mode - Rich Chocolate Tones**
- Background Primary: 30 15% 10% (deep chocolate brown)
- Card Background: 30 18% 14% (rich dark brown)
- Primary Brand: 38 52% 52% (warm terracotta) - unified warm hue
- Accent: 42 58% 52% (warm gold) - for highlights and premium features
- Text Primary: 35 20% 92% (warm cream)
- Text Secondary: 35 12% 70% (soft beige)
- All primary surfaces: hues 28-42 (fully warm-neutral cohesive)

### B. Typography

**Font Families**
- Primary: 'Poppins' (headings, buttons, cards)
- Secondary: 'Quicksand' (body text, labels)
- Monospace: 'JetBrains Mono' (numbers, prices)

**Type Scale**
- Hero/Page Title: text-3xl md:text-4xl font-semibold
- Section Header: text-2xl font-medium
- Card Title: text-lg font-medium
- Body: text-base
- Caption: text-sm
- Small: text-xs

### C. Layout System

**Spacing Primitives**: Consistently use 4, 8, 16, 24 (p-1, p-2, p-4, p-6, p-8, p-12)
- Component padding: p-4 (mobile), p-6 (desktop)
- Section spacing: py-8 md:py-12
- Card gaps: gap-4
- Grid spacing: gap-6

**Container Widths**
- Mobile: Full width with px-4
- Desktop: max-w-6xl mx-auto
- Cards: min-w-[280px] for mobile touch targets

**Grid Patterns**
- Dashboard Stats: grid-cols-2 md:grid-cols-4
- Product Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: Single column mobile, 2-column desktop where appropriate

### D. Component Library

**Navigation**
- Bottom tab bar (mobile): 5 main modules with cupcake/oven/box icons
- Header: Minimal with logo, notifications, profile
- Breadcrumbs: For nested navigation in modules

**Cards**
- Elevated cards with soft shadows (shadow-sm)
- Rounded corners: rounded-xl
- Hover state: subtle scale transform (hover:scale-[1.02])
- Status badges in top-right corner

**Buttons**
- Primary: Filled with primary brand color, rounded-lg
- Secondary: Outline with border-2
- Icon buttons: rounded-full for FAB actions
- Size: Minimum 44px touch target (mobile)

**Forms**
- Input fields: Soft rounded (rounded-lg), border-2
- Labels: text-sm font-medium above inputs
- Helper text: text-xs text-secondary below
- Dropdowns: Custom styled with dessert-themed icons

**Data Display**
- Tables: Minimal borders, alternating row colors for mobile
- Stats cards: Large numbers in monospace with icons
- Charts: Soft gradient fills in brand colors
- Status indicators: Colored dots + text labels

**Modals & Overlays**
- Bottom sheets for mobile (slide up)
- Centered modals for desktop
- Backdrop: bg-black/40 with blur

### E. Iconography & Images

**Icons**
- Library: Heroicons (outline for navigation, solid for actions)
- Custom dessert icons: Cupcake, mixing bowl, delivery box, money, chart
- Size: w-5 h-5 (navigation), w-6 h-6 (cards), w-8 h-8 (empty states)

**Images**
- Product photos: Square aspect ratio, rounded-xl
- Empty states: Illustration style with soft colors
- Dashboard hero: Optional dessert-themed illustration banner

### F. Mobile-First Specifics

**Touch Targets**
- Minimum 44x44px for all interactive elements
- Generous spacing between clickable items (min gap-2)
- Swipe gestures: Delete vendor, mark as paid

**Bottom Navigation**
- Fixed position with safe area padding
- Active state: Primary color with subtle scale
- Labels: Hide on scroll (icons only)

**Sticky Elements**
- Page headers: Sticky with shadow on scroll
- Action buttons: Floating FAB bottom-right (mb-20 to clear nav)
- Filter bars: Sticky below header

### G. Animations

**Minimal & Purposeful Only**
- Page transitions: Simple fade (duration-200)
- Card entry: Stagger with slight slide-up (only on initial load)
- Status changes: Color transition (duration-300)
- Loading: Spinner with brand color
- No: Parallax, continuous animations, or scroll-triggered effects

---

## Module-Specific Design Notes

**Dashboard**: Grid of stat cards with large numbers, recent activity list, quick action FABs

**Produk & Resepi**: Card-based layout with product images, expandable recipe details, cost breakdown in tabular format

**Produksi Harian**: Calendar selector, batch form, ingredient checklist with auto-calculated stock deduction

**Hantar ke Vendor**: Vendor selector with photos, product checklist, auto-generated invoice preview with download button

**Jualan & Claim**: Transaction list with filter chips, vendor payment status with color-coded badges, weekly/monthly toggle

**Kos & Perbelanjaan**: Category tabs, expense entry form, receipt upload placeholder, category breakdown chart

**Laporan**: Toggle between time periods, profit/loss summary cards, simple bar/line charts with soft gradients, export button

---

## Accessibility

- WCAG AA contrast ratios maintained in both modes
- Focus indicators: 2px solid ring in primary color
- Screen reader labels on icon-only buttons
- Form validation: Inline with icons + text
- Responsive text sizing (clamp for fluid typography)
- Consistent dark mode across all inputs and modals