// SPDX-License-Identifier: GPL-3.0-or-later
package org.libredroid.launcher;

import android.graphics.drawable.Drawable;

public class AppItem {
    private final String label;
    private final String packageName;
    private final String className;
    private final Drawable icon;

    public AppItem(String label, String packageName, String className, Drawable icon) {
        this.label = label;
        this.packageName = packageName;
        this.className = className;
        this.icon = icon;
    }

    public String getLabel() {
        return label;
    }

    public String getPackageName() {
        return packageName;
    }

    public String getClassName() {
        return className;
    }

    public Drawable getIcon() {
        return icon;
    }
}
