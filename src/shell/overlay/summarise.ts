export function summarise(blockers: { title: string }[], fakes: { title: string }[]) {
  const b = blockers.length;
  const f = fakes.length;

  if (b === 0 && f === 0)
    return { headline: "All clear", sub: "Nothing degraded.", walkLabel: "close", canWalk: false };

  if (b === 0)
    return {
      headline: `${f} ${f === 1 ? "component is" : "components are"} faked`,
      sub: "Nothing is missing — these are stubs, not failures.",
      walkLabel: "review",
      canWalk: false,
    };

  return {
    headline: `${b} ${b === 1 ? "blocker" : "blockers"} degrading this session`,
    sub: f
      ? `plus ${f} faked ${f === 1 ? "component" : "components"} — fix the blockers to restore full function.`
      : "Fix these to restore full function.",
    walkLabel: `walk me through ${b}?`,
    canWalk: true,
  };
}
