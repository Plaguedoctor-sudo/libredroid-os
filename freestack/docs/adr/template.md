# Architectural Decision Record (ADR) Template

## Title: ADR-NNNN: [Short Imperative Title]
- **Status:** [Draft | Accepted | Superseded | Deprecated]
- **Date:** YYYY-MM-DD
- **Author:** [Name / Email]
- **Relevant Subsystems:** [§N]

---

## 1. Context & Problem Statement
Describe the architectural context, constraints, and the specific security or design failure mode being addressed.

## 2. Decision
State the architectural decision and the concrete technical mechanism chosen.

## 3. The 10-Year Test (Mandatory)
*How will this decision age over a decade of continuous evolution?*
1. **F1 Component Replaceability:** Can this component be swapped without touching adjacent services?
2. **F2 Ambient Authority Elimination:** Does this design rely on ambient domain privileges or held capability handles?
3. **F3 Machine Introspectability:** Can this state and configuration be driven programmatically via Cap'n Proto IPC without a GUI?
4. **F4 Cryptographic Agility:** Can cryptographic algorithms (e.g. PQ crypto migration) be updated by policy without flag days?
5. **F5 Multi-Form Portability:** Does this mechanism operate identically across phone, laptop, microVM, and headless profiles?
6. **F6 Long-Term ABI Stability:** Will a binary compiled today against this interface execute safely in 10–20 years?

## 4. Consequences
- **Positive:**
- **Negative / Trade-offs:**
- **Compensating Controls:**
