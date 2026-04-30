

let lockCount = 0;
let originalOverflow = null;

export function lockScroll() {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && originalOverflow !== null) {
    document.body.style.overflow = originalOverflow;
    originalOverflow = null;
  }
}

export function useScrollLock(shouldLock = true) {
  if (!shouldLock) return;

  if (typeof window !== "undefined") {
    if (shouldLock && window.innerWidth <= 768) {
      lockScroll();
      return () => unlockScroll();
    }
  }
}
