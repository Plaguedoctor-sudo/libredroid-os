import { useEffect, useRef, useState } from "react";

export function usePanelOverflow<T extends HTMLElement = HTMLDivElement>() {
  const scrollRef = useRef<T | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      const isOverflowing = el.scrollHeight > el.clientHeight + 1;
      setOverflowing(isOverflowing);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return { scrollRef, overflowing };
}
