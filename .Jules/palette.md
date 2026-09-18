## 2026-09-10 - Read-Only Security Constraints & Accessible Modals
**Learning:** This read-only application strictly enforces zero form/input elements (`<input>`, `<textarea>`, `<select>`, `<form>`) and zero write API methods to comply with Listing #23. Micro-UX improvements must rely on ARIA roles, semantic markup, keyboard listeners (like `Escape` for flyouts), and `:focus-visible` styles without introducing form controls or innerHTML.
**Action:** Always maintain accessibility via pure ARIA attributes and keyboard shortcuts while strictly adhering to zero-input and zero-innerHTML invariants.

## 2026-09-11 - Dialog Flyout Focus Restoration
**Learning:** In single-page applications with non-modal flyout drawers, moving keyboard focus into the flyout upon opening without saving `document.activeElement` causes keyboard users to lose focus position in the document when dismissing the flyout. Restoring focus to the triggering element upon closing (via close button or Escape key) maintains seamless keyboard flow (WCAG 2.4.3 Focus Order).
**Action:** Always capture `STATE.lastFocusedElement = document.activeElement` when opening flyouts or dialogs, and restore focus upon dismissal.

## 2026-09-18 - Multi-Drawer Focus Restoration Options
**Learning:** When one drawer automatically closes another drawer during user navigation (e.g. opening a story drawer while a citizen dossier is open), calling a closing function that unconditionally restores focus will return focus to the previously focused element and wipe `lastFocusedElement`. Supporting a `restoreFocus: false` option on close methods preserves origin focus for when the final active drawer is eventually dismissed.
**Action:** Always pass `options = { restoreFocus: true }` in drawer dismissal utilities when chaining or replacing active panels.
