## 2026-09-10 - Read-Only Security Constraints & Accessible Modals
**Learning:** This read-only application strictly enforces zero form/input elements (`<input>`, `<textarea>`, `<select>`, `<form>`) and zero write API methods to comply with Listing #23. Micro-UX improvements must rely on ARIA roles, semantic markup, keyboard listeners (like `Escape` for flyouts), and `:focus-visible` styles without introducing form controls or innerHTML.
**Action:** Always maintain accessibility via pure ARIA attributes and keyboard shortcuts while strictly adhering to zero-input and zero-innerHTML invariants.

## 2026-09-11 - Dialog Flyout Focus Restoration
**Learning:** In single-page applications with non-modal flyout drawers, moving keyboard focus into the flyout upon opening without saving `document.activeElement` causes keyboard users to lose focus position in the document when dismissing the flyout. Restoring focus to the triggering element upon closing (via close button or Escape key) maintains seamless keyboard flow (WCAG 2.4.3 Focus Order).
**Action:** Always capture `STATE.lastFocusedElement = document.activeElement` when opening flyouts or dialogs, and restore focus upon dismissal.

## 2026-09-18 - Multi-Drawer Focus Restoration Options
**Learning:** When one drawer automatically closes another drawer during user navigation (e.g. opening a story drawer while a citizen dossier is open), calling a closing function that unconditionally restores focus will return focus to the previously focused element and wipe `lastFocusedElement`. Supporting a `restoreFocus: false` option on close methods preserves origin focus for when the final active drawer is eventually dismissed.
**Action:** Always pass `options = { restoreFocus: true }` in drawer dismissal utilities when chaining or replacing active panels.

## 2026-09-25 - Keyhint Discoverability & External Link Context
**Learning:** Visual projection toggles and modal navigation controls often support keyboard shortcuts (`1`, `2`, `3`, `Space`, `Left/Right`), but screen readers and keyboard users cannot discover them if shortcuts are missing from `aria-label` or button text. Combining visual keyhints (`[1]`, `[2]`, `[3]`) with descriptive `aria-label` attributes and "(opens in new tab)" link descriptions significantly improves keyboard discoverability and context awareness (WCAG 2.4.4 Link Purpose).
**Action:** Include keyboard shortcut hints directly in interactive control ARIA labels and annotate all `target="_blank"` external links.

## 2026-10-02 - Modal Focus Trapping in Flyout Drawers
**Learning:** When overlay flyout drawers are marked with `role="dialog"` and `aria-modal="true"`, pressing `Tab` without key interception allows focus to drift into obscured background elements behind the overlay. Catching `Tab` and `Shift+Tab` in keydown listeners to wrap focus between the first and last visible interactive controls inside active flyout panels ensures compliance with WCAG 2.4.3 (Focus Order) and WCAG 2.1.2 (No Keyboard Trap).
**Action:** Always intercept `Tab` key navigation when `aria-modal="true"` dialog flyouts are active to keep focus trapped within the panel controls.

## 2026-10-09 - Chained Drawer Origin Focus Preservation
**Learning:** When interactive elements inside an active flyout drawer trigger a secondary flyout drawer (e.g. clicking an interlocutor pill inside a citizen dossier to open a story archive), unconditionally setting `lastFocusedElement = document.activeElement` overwrites the original origin element on the main page with a control inside the closing flyout. When the secondary flyout is dismissed, focus is mistakenly attempted on a hidden/closed element. Ignoring active elements contained within active flyout panels when recording origin focus preserves seamless keyboard navigation back to the primary page trigger (WCAG 2.4.3 Focus Order).
**Action:** When capturing origin focus upon opening flyouts, verify `!activeFlyout.contains(document.activeElement)` before updating `lastFocusedElement`.
