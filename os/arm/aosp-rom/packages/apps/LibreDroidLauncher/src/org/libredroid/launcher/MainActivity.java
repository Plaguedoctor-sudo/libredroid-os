// SPDX-License-Identifier: GPL-3.0-or-later
package org.libredroid.launcher;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.GridView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class MainActivity extends Activity {
    private GridView gridView;
    private EditText searchBar;
    private TextView emptyText;
    private List<AppItem> allApps = new ArrayList<>();
    private List<AppItem> filteredApps = new ArrayList<>();
    private AppAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        gridView = findViewById(R.id.app_grid);
        searchBar = findViewById(R.id.search_bar);
        emptyText = findViewById(R.id.empty_text);

        adapter = new AppAdapter(this, filteredApps);
        gridView.setAdapter(adapter);

        loadInstalledApps();

        gridView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                if (position < filteredApps.size()) {
                    AppItem app = filteredApps.get(position);
                    launchApp(app);
                }
            }
        });

        searchBar.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterApps(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadInstalledApps();
        if (searchBar != null && searchBar.getText() != null) {
            filterApps(searchBar.getText().toString());
        }
    }

    @Override
    public void onBackPressed() {
        // Prevent launcher from closing on Back button
        if (searchBar != null && searchBar.length() > 0) {
            searchBar.setText("");
        }
    }

    private void loadInstalledApps() {
        PackageManager pm = getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> resolved = pm.queryIntentActivities(intent, 0);
        allApps.clear();

        for (ResolveInfo ri : resolved) {
            if (ri.activityInfo == null) continue;
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(getPackageName())) continue; // Skip launcher itself

            String label = ri.loadLabel(pm).toString();
            String cls = ri.activityInfo.name;
            allApps.add(new AppItem(label, pkg, cls, ri.loadIcon(pm)));
        }

        Collections.sort(allApps, new Comparator<AppItem>() {
            @Override
            public int compare(AppItem a, AppItem b) {
                return a.getLabel().compareToIgnoreCase(b.getLabel());
            }
        });

        filterApps(searchBar != null ? searchBar.getText().toString() : "");
    }

    private void filterApps(String query) {
        filteredApps.clear();
        String q = query.trim().toLowerCase();
        for (AppItem app : allApps) {
            if (q.isEmpty() || app.getLabel().toLowerCase().contains(q)) {
                filteredApps.add(app);
            }
        }
        if (adapter != null) {
            adapter.notifyDataSetChanged();
        }
        if (emptyText != null) {
            emptyText.setVisibility(filteredApps.isEmpty() ? View.VISIBLE : View.GONE);
        }
    }

    private void launchApp(AppItem app) {
        try {
            Intent launchIntent = new Intent(Intent.ACTION_MAIN);
            launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            launchIntent.setComponent(new ComponentName(app.getPackageName(), app.getClassName()));
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            startActivity(launchIntent);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to launch: " + app.getLabel(), Toast.LENGTH_SHORT).show();
        }
    }
}
