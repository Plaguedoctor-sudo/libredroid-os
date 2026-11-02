-- os/infra/wireplumber/90-lrd.lua
-- per-domain sinks, so an anon-domain stream cannot be seen by the work domain
table.insert(alsa_monitor.rules, {
  matches = { { { "node.name", "matches", "alsa_output.*" } } },
  apply_properties = {
    ["node.description"] = "System output",
    ["priority.driver"] = 1000,
    ["priority.session"] = 1000,
    ["api.alsa.period-size"] = 256,
    ["api.alsa.headroom"] = 8192,
  },
})
-- a virtual sink the shell can route per-domain output into
table.insert(alsa_monitor.rules, {
  matches = { { { "node.name", "matches", "~lrd_domain_.*" } } },
  apply_properties = { ["node.nick"] = "LibreDroid domain" },
})
