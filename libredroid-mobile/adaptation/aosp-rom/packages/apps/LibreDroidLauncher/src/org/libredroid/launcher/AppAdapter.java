// SPDX-License-Identifier: GPL-3.0-or-later
package org.libredroid.launcher;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import java.util.List;

public class AppAdapter extends BaseAdapter {
    private final Context context;
    private final List<AppItem> appList;

    public AppAdapter(Context context, List<AppItem> appList) {
        this.context = context;
        this.appList = appList;
    }

    @Override
    public int getCount() {
        return appList.size();
    }

    @Override
    public Object getItem(int position) {
        return appList.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        ViewHolder holder;
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(R.layout.item_app, parent, false);
            holder = new ViewHolder();
            holder.iconView = convertView.findViewById(R.id.app_icon);
            holder.labelView = convertView.findViewById(R.id.app_label);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }

        AppItem item = appList.get(position);
        holder.labelView.setText(item.getLabel());
        holder.iconView.setImageDrawable(item.getIcon());

        return convertView;
    }

    private static class ViewHolder {
        ImageView iconView;
        TextView labelView;
    }
}
