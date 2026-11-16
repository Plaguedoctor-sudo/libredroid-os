// SPDX-License-Identifier: Apache-2.0
package android.os;

/**
 * Sovereign OS Platform API interface.
 * {@hide}
 */
interface ILibreDroidManager {
    boolean isSovereignEnforced();
    int getSecurityLevel();
    String getActiveDomain();
}
