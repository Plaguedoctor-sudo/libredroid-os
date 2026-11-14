# Sovereign OS — Printing Subsystem Specification

The printing service enforces sandboxed IPP (Internet Printing Protocol) over TLS / mDNS:
- Zero raw unconfined spooler daemons
- PDF conversion hermetically executed within Landlock + Seccomp sandboxed worker
- Direct IPP/IPPS client communication with zero persistent spool storage on disk
