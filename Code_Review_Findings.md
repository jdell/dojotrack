# Code Review Findings

Two-project review covering **EntrenaDojo** (dojotrack) and **Mensajeras**.

---

## Project 1: EntrenaDojo (dojotrack)

### 1. Static/Hardcoded Text That Should Be Dynamic

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/components/sidebar.tsx` | 88 | Default `clubName = "Your Dojo"` is in English in a trilingual app (EN/ES/GL). If no club is loaded, users see "Your Dojo" instead of a translated fallback. | Use a translated placeholder from `useTranslations("Nav")` instead of the hardcoded English string. |
| `src/lib/constants.ts` | 4-8 | `BRAND.tagline` is hardcoded in English (`"Martial arts club management, simplified."`). Used in the footer. | Move tagline to i18n messages so it renders in the user's locale. |
| `src/lib/constants.ts` | 322-339 | `DISCIPLINES` labels are all English-only (`"Brazilian Jiu-Jitsu"`, `"Karate"`, etc.). These appear in forms, badges, and the public club page. | Add i18n keys for discipline labels or pass them through `useTranslations`. |
| `src/lib/constants.ts` | 386-400 | `REQUIREMENT_TYPES` labels are English-only (`"Time at rank"`, `"Classes attended"`, etc.). | Use i18n keys. |
| `src/lib/constants.ts` | 406-414 | `BILLING_INTERVAL_LABELS` are English-only (`"Monthly"`, `"/mo"`, etc.). | Use i18n keys. |
| `src/lib/constants.ts` | 56-318 | All belt names are English-only (`"White Belt"`, `"Blue Belt (2nd Kyu)"`, etc.). Shown on student profiles, exam pages, and the belts manager. | Belt names should either be i18n-aware or stored in the database per club. |
| `src/app/[locale]/layout.tsx` | 13-16 | Root metadata `title` and `description` are hardcoded in English despite the locale being available. | Use `getTranslations` to set locale-aware metadata (the landing page already does this correctly, but the root layout overrides it). |
| `src/app/[locale]/(app)/students/student-form.tsx` | 18-19 | `inputClass` uses `border-slate-300` and `text-slate-700` (hardcoded light-mode colors). Shared between create and edit forms. | Use theme tokens (`border-border`, `text-foreground`). |
| `src/app/[locale]/(app)/classes/class-form.tsx` | 31-32 | Same hardcoded `border-slate-300` / `text-slate-700` in `inputClass` and `labelClass`. | Use theme tokens. |

### 2. Missing API Routes / Dead Links

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/[locale]/page.tsx` | 103-106 | Footer links for "About" (`href="#"`) and "Privacy" (`href="#"`) are dead placeholder links. | Create actual `/about` and `/privacy` pages or remove the links. |
| `src/app/[locale]/(app)/students/students-table.tsx` | 139-140 | Attendance column always shows `"---"` (hardcoded dash). Payment column always shows a `"Pending"` badge regardless of actual payment status. | Wire these to real attendance/payment data from the student record. |
| `src/app/[locale]/club/[slug]/page.tsx` | 262-267 | "Schedule" section is a permanent placeholder: `{t("scheduleSoon")}`. Even when classes exist in the DB, the public page never shows them. | Query and display the club's actual class schedule. |

### 3. Dark Mode Issues

EntrenaDojo primarily uses CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`) from its theme system, which is correct. However, several forms break this pattern:

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/[locale]/(app)/students/student-form.tsx` | 18 | `border-slate-300` on inputs has no dark variant. | Use `border-border`. |
| `src/app/[locale]/(app)/students/student-form.tsx` | 19 | `text-slate-700` on labels has no dark variant. | Use `text-foreground` or `text-brand-navy`. |
| `src/app/[locale]/(app)/students/student-form.tsx` | 151 | `bg-white` on select elements. | Use `bg-background` or `bg-card`. |
| `src/app/[locale]/(app)/students/[id]/edit/student-edit-form.tsx` | 23-24 | Same `border-slate-300` / `text-slate-700` pattern. | Use theme tokens. |
| `src/app/[locale]/(app)/classes/class-form.tsx` | 31-32 | Same issue on class form inputs and labels. | Use theme tokens. |
| `src/app/[locale]/(app)/classes/[id]/session-manager.tsx` | 247 | `border-slate-300 bg-white` on drop-in select. | Use `border-border bg-background`. |
| `src/app/[locale]/(app)/classes/[id]/session-manager.tsx` | 277 | `border-slate-300` on cancel reason input. | Use `border-border`. |
| `src/app/[locale]/(auth)/login/page.tsx` | 58 | `bg-white`, `border-slate-100`, `shadow-slate-900/[0.04]` on card. | Use `bg-card`, `border-border`. |
| `src/app/[locale]/(auth)/login/page.tsx` | 81-82 | `text-slate-700` on labels, `border-slate-300` on inputs. | Use theme tokens. |
| `src/app/[locale]/(auth)/register/page.tsx` | 101, 152 | Same `bg-white` / `border-slate-100` card pattern. | Use theme tokens. |
| `src/app/[locale]/(auth)/register/page.tsx` | 179-219 | All form inputs use `border-slate-300 bg-white`. | Use theme tokens. |
| `src/app/[locale]/club/[slug]/page.tsx` | 137-364 | Entire public club page uses hardcoded light palette: `bg-slate-50`, `bg-white`, `border-slate-200`, `text-brand-navy`, `text-slate-500`. No dark mode support at all. | Add dark mode variants to all classes. |
| `src/app/[locale]/(app)/settings/settings-form.tsx` | 262-271 | Toast notification uses `bg-white`, `shadow-slate-900/10`. | Use `bg-card`, `shadow-foreground/10`. |

### 4. Missing Features / Incomplete Implementations

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/api/students/[id]/route.ts` | N/A | No DELETE handler for students. Students can be deactivated via the edit form but never fully deleted. | Add a DELETE route handler, or confirm this is by design and add a "soft delete" mechanism. |
| `src/app/[locale]/(app)/students/students-table.tsx` | 139 | Attendance data is never populated -- column always shows `"---"`. | Query actual check-in counts per student and display them. |
| `src/app/[locale]/(app)/students/students-table.tsx` | 142-144 | Payment status is hardcoded to always show `"Pending"` with an amber badge, regardless of whether the student has an active membership. | Check the student's membership status and display the correct badge. |
| `src/app/[locale]/(app)/classes/page.tsx` | N/A | No edit page for classes. There's Create and Delete, but no way to update a class's name, schedule, or capacity after creation. | Add an edit form + PATCH API route, or add an edit link on the class detail page. |
| `src/app/[locale]/(app)/competitions/page.tsx` | N/A | No edit or delete for competitions after creation. The detail page exists but has no mutation controls. | Add edit/delete capabilities. |
| `src/app/[locale]/(app)/sparring/page.tsx` | N/A | No edit or delete for sparring sessions. | Add edit/delete capabilities. |
| `src/app/[locale]/(app)/belts/page.tsx` | N/A | No way to delete or reorder belt ranks from the UI. The belts manager (`belts-manager.tsx`) allows editing requirements but not rank management. | Add rank reordering and deletion. |

### 5. Security Concerns

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/api/students/route.ts` | 10-16 | GET handler for `/api/students` returns an empty array when DB is not configured, but does not return 401. The `requireAuth()` call on line 14 properly gates it only when the DB IS configured. However, the inconsistency means the response structure differs based on config state. | Minor -- behavior is acceptable for development. |
| `src/app/[locale]/(app)/students/[id]/page.tsx` | 42-43 | `getStudentProfile(id)` does not receive a `clubId` parameter, meaning it could potentially return students from other clubs if the query function doesn't scope internally. | Verify that `getStudentProfile` scopes by the current club internally (check `lib/queries.ts`). |

---

## Project 2: Mensajeras

### 1. Static/Hardcoded Text That Should Be Dynamic

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/page.tsx` | 6-21 | Landing page `steps` array has hardcoded Spanish text in a JS constant. Not translatable and not sourced from a CMS. | Acceptable for a Spanish-only app, but could be moved to a constants file for maintainability. |
| `src/app/page.tsx` | 62 | `"Plataforma exclusiva para colombofilos"` eyebrow is hardcoded inline. | Move to a constants or config file. |
| `src/app/derby/config/page.tsx` | 271-272 | URL preview shows `mensajeras.es/derby/` with a fallback `"tu-slug"` when the slug is empty. The domain is hardcoded rather than read from `NEXT_PUBLIC_URL`. | Use `process.env.NEXT_PUBLIC_URL` or a constant for the base domain. |
| `src/app/derby/page.tsx` | 38-39 | `"Bienvenido"` and `"Tu solicitud esta pendiente de aprobacion."` are hardcoded inline rather than in a translations/constants file. | Extract to constants. |
| `src/app/derby/page.tsx` | 88 | `"Pendiente de aprobacion"` hardcoded inline. | Extract to constants. |
| `src/app/faq/page.tsx` | 4-37 | All FAQ content is hardcoded in the component. | Move to a separate data file or CMS. |
| `src/app/bidder/page.tsx` | 87-88 | `"Sin subastas activas"` and the explanation are hardcoded. | Fine for Spanish-only, but extract to constants for maintainability. |

### 2. Missing API Routes / Dead Links

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/derby/items/[id]/page.tsx` | 99-104 | "Editar" button links to `/derby/items/${item.id}/editar`, but **this page does not exist**. There is no `editar/page.tsx` under `items/[id]/`. | Create the edit page at `src/app/derby/items/[id]/editar/page.tsx`, or remove the edit link. |
| `src/app/api/derby/items/route.ts` | N/A | Only has POST (create). No PATCH or DELETE for items. The non-existent edit page would need a PATCH endpoint. | Add PATCH and DELETE handlers for `/api/derby/items/[id]`. |
| `src/app/derby/subastas/[id]/page.tsx` | N/A | No edit page for auctions. Once created, title/description/dates cannot be modified. | Add an edit form for draft/active auctions. |
| `src/middleware.ts` | 55 | Hardcoded public derby path: `const publicDerbyPaths = ["/derby/a-pedra-da-sal"];` references a specific club slug. This variable is declared but never used (the regex `isDerbySlugPage` handles the logic). Dead code. | Remove the unused `publicDerbyPaths` constant. |
| `src/app/admin/page.tsx` | 142-162 | Admin approve/reject buttons use `<form action="/api/admin/derbys/${derby.id}/approve" method="POST">`. These are standard HTML form POSTs but the API routes are App Router route handlers that expect to be called as fetch requests. This works in Next.js but bypasses any CSRF protection. | Consider using client-side fetch with confirmation dialogs instead of raw form submissions. |

### 3. Dark Mode Issues (Critical -- Mensajeras supports dark mode via ThemeToggle)

Mensajeras has a theme toggle (`ThemeToggle.tsx`) and a cookie-based dark class on `<html>`. However, **the vast majority of pages use hardcoded light-mode colors** without `dark:` variants. This means most of the app is unreadable or invisible in dark mode.

#### Derby Admin Pages (most severe):

| File | Line(s) | Issue |
|------|---------|-------|
| `src/app/derby/items/page.tsx` | 41, 44, 59, 89 | `text-slate-900`, `bg-white`, `border-slate-200` throughout. Cards, text, empty states are all light-only. |
| `src/app/derby/items/nueva/page.tsx` | 97, 106-107, 112, 121 | Entire form uses `bg-white`, `text-slate-900`, `text-slate-800`, `text-slate-700`, `border-slate-300`, `border-slate-200`. Form would be invisible in dark mode. |
| `src/app/derby/items/[id]/page.tsx` | 91-92, 96, 155, 181, 188, 199, 206, 222, 233, 239 | Item detail page: `text-slate-900`, `bg-white`, `border-slate-200`, `text-slate-700`, `text-slate-400`. All light-only. |
| `src/app/derby/pujadores/page.tsx` | 87, 89, 91 | `text-slate-900`, `text-slate-500`. |
| `src/app/derby/pujadores/PujadoresList.tsx` | 91, 107, 115, 129 | `bg-white`, `text-slate-900`, `border-slate-300`, `border-slate-200`. Search box, cards, table rows all light-only. |
| `src/app/derby/transacciones/page.tsx` | 48, 52, 62, 71 | `text-slate-900`, `bg-white`, `border-slate-200`. Transaction cards light-only. |
| `src/app/derby/config/page.tsx` | 127-128, 175-176 | All form inputs: `text-slate-900`, `border-slate-300`, `text-slate-700`. Section cards: `bg-white`, `border-slate-200`. |
| `src/app/derby/subastas/nueva/page.tsx` | 69, 77, 81, 88 | `text-slate-900`, `bg-white`, `text-slate-700`, `border-slate-300`. Auction creation form entirely light. |

#### Bidder Pages:

| File | Line(s) | Issue |
|------|---------|-------|
| `src/app/bidder/layout.tsx` | 12-14 | Header: `bg-white`, `border-slate-200`, `text-slate-900`. |
| `src/app/bidder/layout.tsx` | 39-40 | Bottom nav: `bg-white`, `border-slate-200`, `text-slate-500`. |
| `src/app/bidder/page.tsx` | 59, 62, 84, 99, 115, 129, 130 | `text-slate-900`, `bg-white`, `border-slate-200`. All auction cards and empty states light-only. |

#### Auth Pages:

| File | Line(s) | Issue |
|------|---------|-------|
| `src/app/(auth)/login/page.tsx` | 62 | Card: `bg-white`, `border-slate-100`, `text-slate-900`. |
| `src/app/(auth)/login/page.tsx` | 64-65 | Logo text: `text-slate-900`. |
| `src/app/(auth)/login/page.tsx` | 68, 72, 81, 91-92, 98-99, 105 | Form labels, inputs, buttons, dividers: all `text-slate-700`, `border-slate-300`, `bg-white`, `border-slate-200`. |
| `src/app/(auth)/registro/page.tsx` | 97, 133 | Card: `bg-white`, `border-slate-100`, `text-slate-900`. |
| `src/app/(auth)/registro/page.tsx` | 170, 173, 183 | All form inputs: `border-slate-300`, `text-slate-700`. |

#### Admin Pages:

| File | Line(s) | Issue |
|------|---------|-------|
| `src/app/admin/layout.tsx` | 18 | Sidebar: `bg-white`, `border-slate-200`. |
| `src/app/admin/layout.tsx` | 20 | Logo text: `text-slate-900`. |
| `src/app/admin/page.tsx` | 74, 81-83, 89, 104, 112, 130, 133, 167, 177, 186 | Entire admin panel: `bg-white`, `text-slate-900`, `border-slate-200`, `bg-slate-50`, `text-slate-600`. Everything is light-only. |
| `src/app/admin/derbys/page.tsx` | 14, 16, 29, 30 | Table: `bg-white`, `border-slate-200`, `bg-slate-50`, `text-slate-600`, `text-slate-900`. |

#### Public Pages:

| File | Line(s) | Issue |
|------|---------|-------|
| `src/app/faq/page.tsx` | 41, 44, 48, 53-54, 58-59, 63, 70 | Entire FAQ: `bg-white`, `text-slate-900`, `border-slate-200`, `border-slate-100`. |
| `src/app/(public)/terminos/page.tsx` | Likely same | Need to verify but pattern is consistent. |
| `src/app/(public)/privacidad/page.tsx` | Likely same | Same pattern. |

**Summary: The derby dashboard (`src/app/derby/page.tsx`) and the subastas list (`src/app/derby/subastas/page.tsx`) correctly use `dark:` variants. But almost every other page does not. Dark mode toggle exists but ~80% of pages would be broken in dark mode.**

### 4. Missing Features / Incomplete Implementations

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/derby/items/[id]/page.tsx` | 99-104 | Edit link points to non-existent page. No way to edit an item after creation. | Create the edit page and API route. |
| N/A | N/A | No way to DELETE items from the catalog. | Add a delete button on the item detail page with a `/api/derby/items/[id]` DELETE route. |
| N/A | N/A | No way to DELETE auctions. Not even draft auctions can be removed. | Add delete functionality for draft auctions. |
| N/A | N/A | No way to edit auction details (title, description, dates) after creation. | Add edit capability at minimum for draft-status auctions. |
| `src/app/derby/pujadores/page.tsx` | N/A | No way to manually invite a bidder from the pujadores page. The invite flow only exists within individual auctions. Derby-wide bidder management is view-only (plus block/unblock). | Add a "send invitation" form on the pujadores page. |
| `src/app/admin/users/page.tsx` | N/A | Admin users page shows a list but has no actions (no delete, no role change, no details view). | Add user management actions. |
| `src/app/admin/derbys/page.tsx` | N/A | No way to deactivate/suspend a derby from the admin derbys list. Only an approve button exists. | Add deactivate/reject actions. |
| `src/app/bidder/historial/page.tsx` | N/A | History page exists but likely only shows won/lost auctions. No search or filter capability. | Add date range and status filters. |

### 5. Security Concerns

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/app/admin/derbys/page.tsx` | 4 | Page queries ALL derbys without any auth check. The admin layout (`admin/layout.tsx`) checks `ADMIN_EMAILS`, but the page itself does `prisma.derby.findMany()` without verifying the caller is an admin. If someone bypasses the layout (direct API or rendering), they'd see all data. | Add an explicit admin check inside the page component as defense-in-depth. |
| `src/app/admin/page.tsx` | 34 | Same issue -- admin page queries all users, derbys, auctions, and bids with no auth guard in the page itself. Relies entirely on the layout guard. | Add explicit admin verification. |
| `src/app/admin/users/page.tsx` | N/A | Same pattern -- no auth check in the page. | Add explicit admin verification. |
| `src/app/derby/items/[id]/page.tsx` | 48-52 | Item is fetched by ID and then checked against `derby.id`. However, the `appUser!` non-null assertion on line 25 could crash if the user exists in Supabase but not in the `User` table. | Add a null check for `appUser` before the non-null assertion. |
| `src/app/derby/subastas/page.tsx` | 49 | Same `appUser!` non-null assertion pattern. | Add null check. |
| `src/app/derby/pujadores/page.tsx` | 14 | Same `appUser!` pattern. | Add null check. |
| `src/app/derby/items/page.tsx` | 25 | Same `appUser!` pattern. | Add null check. |
| `src/app/api/derby/items/route.ts` | N/A | Item images are uploaded to Supabase storage. Need to verify that the upload validates file types server-side and limits file size. | Verify server-side validation exists. |
| `src/middleware.ts` | 55-56 | The public derby slug detection regex is complex and could potentially be bypassed. For example, `/derby/config/extra-path` would not match `pathname.startsWith("/derby/config")` if structured differently. | Simplify the public-path detection logic. |

### 6. Consistency Issues

| File | Issue |
|------|-------|
| `src/app/derby/page.tsx` | Uses `dark:` variants correctly (e.g., `dark:bg-slate-800/60`, `dark:border-slate-700`, `dark:text-white`). |
| `src/app/derby/subastas/page.tsx` | Uses `dark:` variants correctly on cards and status ribbons. |
| All other derby pages | Do NOT use `dark:` variants at all. This creates a jarring inconsistency where the dashboard and subastas list look correct in dark mode, but navigating to items, pujadores, config, or transacciones breaks. |

---

## Summary of Critical Issues

### EntrenaDojo
1. **i18n gap**: Belt names, discipline labels, requirement types, and billing intervals are all English-only constants, breaking the ES/GL experience.
2. **Dead footer links**: "About" and "Privacy" link to `#`.
3. **Hardcoded student table data**: Attendance shows "---" and payment always shows "Pending".
4. **No class editing**: Classes can be created and deleted but not edited.
5. **Form dark mode**: Auth pages and forms use hardcoded `slate-*` colors without dark variants.

### Mensajeras
1. **Dark mode is 80% broken**: Only 2 of ~15 pages properly support dark mode despite having a theme toggle. The login, registration, item management, config, admin, FAQ, bidder, and transaction pages all use hardcoded light colors.
2. **Dead edit link**: Item detail page links to `/editar` which does not exist.
3. **No item CRUD**: Items can be created and viewed but not edited or deleted.
4. **No auction editing/deletion**: Auctions cannot be modified or removed after creation.
5. **Non-null assertion crashes**: Multiple derby pages use `appUser!` without null checking, which will crash if the Prisma User record is missing.
6. **Admin pages lack defense-in-depth**: Admin pages rely solely on layout-level auth, with no page-level verification.
