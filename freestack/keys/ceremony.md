# Key ceremony — offline procedure

## Before
1. Air-gapped machine, no network, no radios. Fresh boot.
2. Two witnesses, different organisations. Both sign the transcript.
3. Verify the `minisign` binary hash against a previously published value.
4. Blank removable media for key transfer.

## During
1. Run `tools/gen-root-keys.sh` on the air-gapped machine.
2. Each holder types their own passphrase, in view of witnesses, on their turn.
3. Read each public key fingerprint aloud. Witnesses record all five.
4. Copy `keys/<holder>.key` + `.pub` to that holder's own media, one at a time.
5. Copy `keys/*.pub`, `ROOT-KEYS.txt`, `threshold.json` to a separate media.

## After
1. Publish `keys/*.pub`, `ROOT-KEYS.txt`, `threshold.json` to the repo.
   Private keys never enter the repo.
2. Publish the ceremony transcript with both witness signatures.
3. Each holder stores their private key on hardware, ideally two copies,
   in two physical locations.
4. Destroy the air-gapped machine's copies.
5. Record the fingerprints in `docs/TRUST.md`.

## Rotation
Adding a key needs 3 existing signatures. Removing one needs 4. A key set
lives 24 months maximum, then a new ceremony and a re-signed manifest.
