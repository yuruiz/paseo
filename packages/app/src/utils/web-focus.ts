interface FocusWithRetriesOptions {
  focus: () => void;
  isFocused: () => boolean;
  timeoutMs?: number;
  onSuccess?: () => void;
  onTimeout?: () => void;
}

export function focusWithRetries({
  focus,
  isFocused,
  timeoutMs = 1500,
  onSuccess,
  onTimeout,
}: FocusWithRetriesOptions): () => void {
  let cancelled = false;
  const deadlineMs = Date.now() + timeoutMs;
  const doc = typeof document === "undefined" ? null : document;

  const handleVisibilityChange = () => {
    if (doc?.visibilityState === "hidden") {
      cancelled = true;
    }
  };
  doc?.addEventListener("visibilitychange", handleVisibilityChange);

  const cancel = () => {
    cancelled = true;
    doc?.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const tick = () => {
    if (cancelled) return;

    try {
      focus();
    } catch {
      // ignore
    }

    if (isFocused()) {
      onSuccess?.();
      cancel();
      return;
    }

    if (Date.now() >= deadlineMs) {
      onTimeout?.();
      cancel();
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(tick);
    });
  };

  tick();

  return cancel;
}
