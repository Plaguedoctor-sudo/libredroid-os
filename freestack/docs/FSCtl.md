# fsctl

One binary. Every subsystem. Machine-first.

## Invocation

    fsctl <group> <verb> [--json] [--dry-run] [--ctx <token>] [args]

`--json` is mandatory for scripting and always emits a `common.Envelope`.
Human output is a rendering of the same structure.

## Exit codes (API — stable)

| Code | Meaning |
|---|---|
| 0 | ok |
| 64 | usage error |
| 65 | denied — missing capability |
| 66 | not found |
| 67 | conflict / already in that state |
| 69 | unavailable (hardware absent, service down) |
| 70 | internal |
| 77 | needs a TTY and none present |

## Rules

1. Idempotent. `net up wlan0` twice exits 0 both times.
2. `--dry-run` on every mutating verb, returns the diff it would apply.
3. Never prompts. If input is required it fails 77 with a hint.
4. Never requires an account, a display, or a daemon restart.
5. Every verb maps 1:1 to a schema method. No verb exists that the schema lacks.
6. A GUI-only control is a bug; file it against the subsystem.

## Examples

    fsctl net status --json
    fsctl net allow --proto tcp --dport 443 --daddr 1.2.3.4 --json
    fsctl perm grant com.example.app netDns example.org --json
    fsctl power setProfile saver --json
    fsctl update check --json
    fsctl a11y enable orca --json
