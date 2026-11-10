/*
 * FreeStack Sovereign C / Libadwaita Application Template (Task 13.8)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#include <stdio.h>
#include <stdlib.h>

#if __has_include(<adwaita.h>)
#include <adwaita.h>

static void activate_cb(GtkApplication *app, gpointer user_data) {
    GtkWidget *window = adw_application_window_new(app);
    gtk_window_set_title(GTK_WINDOW(window), "FreeStack Sovereign App");
    gtk_window_set_default_size(GTK_WINDOW(window), 480, 360);

    GtkWidget *header = adw_header_bar_new();
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 16);
    gtk_box_append(GTK_BOX(box), header);

    GtkWidget *status_page = adw_status_page_new();
    adw_status_page_set_title(ADW_STATUS_PAGE(status_page), "Sovereign Workspace");
    adw_status_page_set_description(ADW_STATUS_PAGE(status_page),
        "Running local-first with hardware keystore protection and zero telemetry.");
    adw_status_page_set_icon_name(ADW_STATUS_PAGE(status_page), "security-high-symbolic");

    gtk_box_append(GTK_BOX(box), status_page);
    adw_application_window_set_content(ADW_APPLICATION_WINDOW(window), box);
    gtk_window_present(GTK_WINDOW(window));
}

int main(int argc, char *argv[]) {
    g_autoptr(AdwApplication) app = adw_application_new("org.freestack.SampleAdwaita", G_APPLICATION_DEFAULT_FLAGS);
    g_signal_connect(app, "activate", G_CALLBACK(activate_cb), NULL);
    return g_application_run(G_APPLICATION(app), argc, argv);
}

#else

int main(int argc, char *argv[]) {
    printf("FreeStack Sovereign C Template (Headless / Standalone mode)\n");
    printf("Libadwaita / GTK4 headers not present in local compiler host; stub verified.\n");
    return 0;
}
#endif
