import { useEffect } from "react";

const ROOT_ID = "lrd-overlay-root";

export function useDockInsets() {
  useEffect(() => {
    const publish = (name: string, el: HTMLElement | null) => {
      const target = document.getElementById(ROOT_ID);
      if (!el) {
        target?.style.removeProperty(name); // let the CSS floor win
        document.documentElement.style.removeProperty(name);
        return;
      }
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        const val = `${Math.round(h)}px`;
        target?.style.setProperty(name, val);
        document.documentElement.style.setProperty(name, val);
      } else {
        target?.style.removeProperty(name);
        document.documentElement.style.removeProperty(name);
      }
    };

    let dock = document.querySelector<HTMLElement>("[data-lrd-dock]");
    let gesture = document.querySelector<HTMLElement>("[data-lrd-gesture]");

    const measure = () => {
      publish("--lrd-dock-h", dock);
      publish("--lrd-gesture-h", gesture);
    };

    measure();

    const ro = new ResizeObserver(measure);
    if (dock) ro.observe(dock);
    if (gesture) ro.observe(gesture);

    // the dock unmounts on app launch and on fullscreen surfaces
    const mo = new MutationObserver(() => {
      const nextDock = document.querySelector<HTMLElement>("[data-lrd-dock]");
      const nextGesture = document.querySelector<HTMLElement>("[data-lrd-gesture]");
      if (nextDock !== dock || nextGesture !== gesture) {
        ro.disconnect();
        dock = nextDock;
        gesture = nextGesture;
        if (dock) ro.observe(dock);
        if (gesture) ro.observe(gesture);
        measure();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      const target = document.getElementById(ROOT_ID);
      target?.style.removeProperty("--lrd-dock-h");
      target?.style.removeProperty("--lrd-gesture-h");
      document.documentElement.style.removeProperty("--lrd-dock-h");
      document.documentElement.style.removeProperty("--lrd-gesture-h");
    };
  }, []);
}
