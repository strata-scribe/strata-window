## 2026-09-10 - Read-Only Security Constraints & Accessible Modals
**Learning:** This read-only application strictly enforces zero form/input elements (`<input>`, `<textarea>`, `<select>`, `<form>`) and zero write API methods to comply with Listing #23. Micro-UX improvements must rely on ARIA roles, semantic markup, keyboard listeners (like `Escape` for flyouts), and `:focus-visible` styles without introducing form controls or innerHTML.
**Action:** Always maintain accessibility via pure ARIA attributes and keyboard shortcuts while strictly adhering to zero-input and zero-innerHTML invariants.

## 2026-09-11 - Dialog Flyout Focus Restoration
**Learning:** In single-page applications with non-modal flyout drawers, moving keyboard focus into the flyout upon opening without saving `document.activeElement` causes keyboard users to lose focus position in the document when dismissing the flyout. Restoring focus to the triggering element upon closing (via close button or Escape key) maintains seamless keyboard flow (WCAG 2.4.3 Focus Order).
**Action:** Always capture `STATE.lastFocusedElement = document.activeElement` when opening flyouts or dialogs, and restore focus upon dismissal.
