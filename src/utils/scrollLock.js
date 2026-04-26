/**
 * Scroll Lock Utility
 * Manages body scroll locking to prevent scrolling when modals/overlays are active
 * 
 * Features:
 * - Reference counting to handle multiple overlays
 * - Stores original overflow value for restoration
 * - Safe reset on component unmount
 */

let lockCount = 0;
let originalOverflow = null;

/**
 * Lock body scroll
 * Safe to call multiple times - uses reference counting
 */
export function lockScroll() {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;
}

/**
 * Unlock body scroll
 * Decrements reference count, only restores when count reaches 0
 */
export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && originalOverflow !== null) {
    document.body.style.overflow = originalOverflow;
    originalOverflow = null;
  }
}

/**
 * Hook for managing scroll lock in components
 * Automatically cleans up on unmount
 */
export function useScrollLock(shouldLock = true) {
  if (!shouldLock) return;
  
  if (typeof window !== "undefined") {
    if (shouldLock && window.innerWidth <= 768) {
      lockScroll();
      return () => unlockScroll();
    }
  }
}
