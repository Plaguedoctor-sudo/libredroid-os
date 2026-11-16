// SPDX-License-Identifier: Apache-2.0
package android.os;

import android.content.Context;

/**
 * Manager providing access to LibreDroid sovereign platform features.
 * {@hide}
 */
public class LibreDroidManager {
    public static final String SERVICE = "libredroid";

    private final Context mContext;
    private final ILibreDroidManager mService;

    public LibreDroidManager(Context context, ILibreDroidManager service) {
        mContext = context;
        mService = service;
    }

    public boolean isSovereignEnforced() {
        try {
            return mService != null && mService.isSovereignEnforced();
        } catch (RemoteException e) {
            return false;
        }
    }

    public int getSecurityLevel() {
        try {
            return mService != null ? mService.getSecurityLevel() : 0;
        } catch (RemoteException e) {
            return 0;
        }
    }

    public String getActiveDomain() {
        try {
            return mService != null ? mService.getActiveDomain() : "host";
        } catch (RemoteException e) {
            return "host";
        }
    }
}
