# EntrenaDojo — Timetable Card Redesign POC

## Before

```
 MON                  TUE                  WED                  THU
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ ┌───┐            │ │ ┌───┐            │ │ ┌───┐            │ │ ┌───┐            │
│ │All│            │ │ │All│            │ │ │All│            │ │ │All│            │
│ └───┘            │ │ └───┘            │ │ └───┘            │ │ └───┘            │
│                  │ │                  │ │                  │ │                  │
│ ACONDICIONAMIE...│ │ Fundamentos de   │ │ ACONDICIONAMIE...│ │ Fundamentos de   │
│                  │ │ acondicionamie...│ │                  │ │ acondicionamie...│
│ ⏰ 08:00 – 09:00 │ │ ⏰ 07:00 – 08:00 │ │ ⏰ 08:00 – 09:00 │ │ ⏰ 07:00 – 08:00 │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ ┌───┐            │ │ ┌───┐            │ │ ┌───┐            │ │ ┌───┐            │
│ │Int│            │ │ │All│            │ │ │Int│            │ │ │All│            │
│ └───┘            │ │ └───┘            │ │ └───┘            │ │ └───┘            │
│                  │ │                  │ │                  │ │                  │
│ Niños/as de 8    │ │ Niños/as de 8    │ │ Niños/as de 8    │ │ Niños/as de 8    │
│ a 11 años        │ │ a 11 años        │ │ a 11 años        │ │ a 11 años        │
│ ⏰ 17:30 – 18:30 │ │ ⏰ 17:30 – 18:30 │ │ ⏰ 17:30 – 18:30 │ │ ⏰ 17:30 – 18:30 │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ ┌───┐            │ │ ┌─────┐          │ │ ┌───┐            │ │ ┌───┐            │
│ │Adv│            │ │ │ Beg │          │ │ │Adv│            │ │ │Adv│            │
│ └───┘            │ │ └─────┘          │ │ └───┘            │ │ └───┘            │
│                  │ │                  │ │                  │ │                  │
│ Teenager 12 a 17 │ │ Niños/as de 4    │ │ Teenager 12 a 17 │ │ Teenager 12 a 17 │
│ años Kenpo St... │ │ a 7 años         │ │ años Kenpo St... │ │ años Kenpo St... │
│ ⏰ 18:30 – 19:30 │ │ ⏰ 17:30 – 18:20 │ │ ⏰ 18:30 – 19:30 │ │ ⏰ 18:30 – 19:30 │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Problems:**
- Pill badge (`All`, `Int`, `Adv`) wastes a full line per card
- Card borders on every card create visual noise
- ALL CAPS class names are hard to read
- Narrow columns (max-w-4xl / 6 days = ~130px) truncate names
- Uneven card heights across columns

---

## After

```
 MON                    TUE                    WED                    THU
                                                                      
 ▌ Acondicionamiento    ▌ Fundamentos de        ▌ Acondicionamiento    ▌ Fundamentos de
 ▌ 08:00 – 09:00        ▌ acondicionamiento     ▌ 08:00 – 09:00        ▌ acondicionamiento
                         ▌ adultos                                      ▌ adultos
                         ▌ 07:00 – 08:00                                ▌ 07:00 – 08:00
                                                                      
 ▌ Niños/as de 8        ▌ Niños/as de 8         ▌ Niños/as de 8        ▌ Niños/as de 8
 ▌ a 11 años            ▌ a 11 años             ▌ a 11 años            ▌ a 11 años
 ▌ 17:30 – 18:30        ▌ 17:30 – 18:30         ▌ 17:30 – 18:30        ▌ 17:30 – 18:30
                                                                      
 ▌ Teenager 12 a 17     ▌ Niños/as de 4         ▌ Teenager 12 a 17     ▌ Teenager 12 a 17
 ▌ años Kenpo Striking  ▌ a 7 años              ▌ años Kenpo Striking  ▌ años Kenpo Striking
 ▌ 18:30 – 19:30        ▌ 17:30 – 18:20         ▌ 18:30 – 19:30        ▌ 18:30 – 19:30
                                                                      
 ▌ Kenpo Sumision       ▌ Acondicionamiento     ▌ Kenpo Sumision        
 ▌ Todas las Edades     ▌ Tean Warrior          ▌ Todas las Edades      
 ▌ 19:35 – 20:30        ▌ 08:00 – 09:00         ▌ 19:35 – 20:30        

 ━━ All / Beg    ━━ Intermediate    ━━ Advanced
```

Legend: `▌` = colored left border (green / blue / grey)

---

## Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Level indicator** | Pill badge (`All`, `Int`) on own line | 3px colored left border |
| **Card chrome** | Bordered card with shadow | Borderless, subtle bg only |
| **Class names** | ALL CAPS (from DB) | Title case via CSS `capitalize` |
| **Container width** | `max-w-4xl` (896px) | `max-w-6xl` (1152px) |
| **Column min-width** | ~130px (cramped) | 160px with horizontal scroll |
| **Lines per card** | 4 (badge + gap + name + time) | 2 (name + time) |
| **Legend** | None | Color key below grid |

---

## Code Changes

**File:** `src/app/[locale]/club/[slug]/page.tsx`

### ScheduleCard component (new)

```tsx
const LEVEL_BORDER: Record<string, string> = {
  ALL_LEVELS:    "border-l-green-500 dark:border-l-green-400",
  BEGINNER:      "border-l-green-500 dark:border-l-green-400",
  INTERMEDIATE:  "border-l-blue-500  dark:border-l-blue-400",
  ADVANCED:      "border-l-slate-400 dark:border-l-slate-500",
};

function ScheduleCard({ cs }) {
  const borderColor = LEVEL_BORDER[cs.level]
    ?? "border-l-slate-300 dark:border-l-slate-600";

  return (
    <div className={`border-l-[3px] ${borderColor}
      rounded-r-lg bg-white dark:bg-slate-900 py-1.5 px-3`}>
      <p className="text-sm font-medium text-brand-navy
        leading-snug capitalize">
        {cs.name.toLowerCase()}
      </p>
      <p className="mt-0.5 text-xs text-slate-500
        dark:text-slate-400">
        {cs.startTime} – {cs.endTime}
      </p>
    </div>
  );
}
```

### LevelLegend component (new)

```tsx
function LevelLegend() {
  return (
    <div className="mt-3 flex items-center gap-4">
      {LEVEL_LEGEND.map(({ key, label, dotClass }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`inline-block h-0.5 w-3
            rounded ${dotClass}`} />
          <span className="text-[11px] text-slate-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Layout change

Schedule section breaks out of `max-w-4xl` body into its own `max-w-6xl` container. Grid uses `minmax(160px, 1fr)` with `overflow-x-auto`.
