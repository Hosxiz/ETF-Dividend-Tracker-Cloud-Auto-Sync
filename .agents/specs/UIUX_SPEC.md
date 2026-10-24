# UI/UX Specification: ETF Dividend Tracker

## 1. Aesthetic Direction & Design System
- **Theme Archetype:** Modern Glassmorphism & High-Tech Financial Dashboard (Dark Obsidian & Emerald Accents).
- **Typography:**
  - Primary Font: `'Inter'`, system-ui, -apple-system, sans-serif
  - Monospace Font: `'JetBrains Mono'`, 'Fira Code', monospace (for numbers, tickers, amounts)
  - Scale: H1 (1.875rem), H2 (1.25rem), Body (0.95rem), Caption (0.8rem)
- **Color Palette (Tokens):**
  - Background: `#0B0F17` (Deep Obsidian Void)
  - Surface / Card: `rgba(20, 27, 44, 0.7)` with `backdrop-filter: blur(16px)`
  - Border / Muted: `rgba(255, 255, 255, 0.08)`
  - Primary Accent: `#10B981` (Emerald Green - Dividend growth)
  - Secondary Accent: `#38BDF8` (Cyan Blue - Financial technology)
  - Semantic Status:
    - Success: `#34D399`
    - Warning: `#FBBF24`
    - Danger/Error: `#F87171`
    - Discord Accent: `#5865F2`

## 2. Layout Hierarchy & Responsive Breakpoints
- **Top Bar:** Brand logo "ETF Dividend Tracker v1.3", Discord status badge, and Settings button.
- **Summary KPI Banner:** Total Annual Estimated Payout (USD & THB preview), Next Pay Date Countdown, Active Holdings count.
- **Main Workspace (2-Column Grid on >= 1024px):**
  - Left Column (Portfolio & Slip OCR):
    - Dime Slip Dropzone & OCR Parser card.
    - Holdings list with inline delete, edit shares, and add ticker form.
  - Right Column (Dividend Schedule & Notification):
    - Upcoming Dividends in next 30 days (highlighted with badge).
    - Historical dividend list (last 4–8 payments with Ex-date and Pay-date).
    - Discord Dispatcher: 'Check & Notify' button + Preview message.
    - CSV Export trigger.
- **Mobile (< 768px):** Clean single-column stack with sticky bottom notification bar.

## 3. Component & State Matrix
| Component | Default | Hover / Focus | Active | Loading / Empty / Error |
| :--- | :--- | :--- | :--- | :--- |
| **KPI Metric Card** | Subdued glow, emerald typography | Subtle border illumination | — | Shimmer skeleton |
| **Dime Slip Dropzone** | Dashed glass border | Cyan glow, 1.01x scale | Depressed ring | OCR progress bar with % status |
| **Check & Notify Button** | Discord blurple background | Vibrancy boost, elevation shadow | Scale 0.98 | Spinning loader, disabled state |
| **Slip Confirmation Modal** | Backdrop blur 8px | Field edit focus highlight | Commit button pulse | Validation error on empty ticker |

## 4. Micro-Interactions & Transitions
- Transition speed: `150ms ease-out` on buttons, `200ms cubic-bezier(0.16, 1, 0.3, 1)` on modal popups.
- OCR Progress Feedback: Real-time status text ("Initializing Tesseract...", "Reading text (45%)...", "Extracting fields...").
- Toast Notifications: Slide-in from top-right for Discord dispatch confirmation and error notices.
