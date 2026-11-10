# FreeStack Full-Shell Orca Screen Reader Smoke Test (Task 11.9)

**Work Package Reference**: W11 (Task 11.9)  
**Verification Target**: AT-SPI2 D-Bus bus integrity, Orca speech synthesis, and custom widget a11y trees.

---

## 1. Automated Verification Harness (`tests/test-a11y-smoke.sh`)

Execute from build or live environment:
```bash
./freestack/tests/test-a11y-smoke.sh
```

### Verification Criteria

1. **AT-SPI2 Daemon**:
   - `org.a11y.Bus` is active on D-Bus session bus.
   - Root accessible tree returns valid desktop hierarchy via `accerciser` or `python3-pyatspi`.
2. **Speech Dispatcher & TTS Backend**:
   - `speech-dispatcher` responds on socket with `OK`.
   - `spd-say "FreeStack accessibility operational"` routes audio to PipeWire/ALSA without underrun.
3. **Custom Widget Tree Registration**:
   - `fs-permissions`, `fs-setup`, and shell panel export `ATK_ROLE_DIALOG`, `ATK_ROLE_PUSH_BUTTON`, and `ATK_ROLE_LABEL`.
   - Accessible names and descriptions exist for 100% of interactive widgets.
4. **Orca Headless Initialization**:
   - Orca process starts cleanly without throwing missing GObject introspection exceptions.

---

## 2. Interactive QA Script (Step-by-Step)

| Step | Action | Expected Spoken Output |
|---|---|---|
| 1 | Press `Super` | Orca speaks: *"Search apps, entry text"* |
| 2 | Type `calc` and press `Enter` | Orca speaks: *"Calculator, window, display 0"* |
| 3 | Press `Super + S` | Orca speaks: *"Settings, 12 categories available, Network selected"* |
| 4 | Press `Tab` then `Enter` | Orca speaks current toggle state: *"Wi-Fi enabled, toggle button"* |
| 5 | Trigger app consent prompt | Orca speaks modal alert: *"Permission Request: Calculator requests camera access. Deny button focused."* |
