#ifndef SAP_UI_H
#define SAP_UI_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "sap_compositor.h"

#ifdef __cplusplus
extern "C" {
#endif

// Sovereign UI Palette (High-contrast, zero-glare, dark sovereign theme)
#define SAP_COLOR_BG_DARK       0xFF101216
#define SAP_COLOR_SURFACE       0xFF181B22
#define SAP_COLOR_CARD          0xFF222630
#define SAP_COLOR_ACCENT_CYAN   0xFF00E5FF
#define SAP_COLOR_ACCENT_GREEN  0xFF00E676
#define SAP_COLOR_ACCENT_GOLD   0xFFFFD600
#define SAP_COLOR_ACCENT_RED    0xFFFF5252
#define SAP_COLOR_TEXT_PRIMARY  0xFFF0F4F8
#define SAP_COLOR_TEXT_MUTED    0xFF8E99A8
#define SAP_COLOR_BORDER        0xFF2D323E

typedef struct {
    uint32_t width;
    uint32_t height;
    uint32_t stride;
    uint32_t* pixels;
} SapCanvas;

typedef struct {
    char app_id[64];
    char title[64];
    uint32_t width;
    uint32_t height;
    SapCanvas canvas;
    uint64_t surface_id;
    uint64_t frame_count;
} SapWindow;

// Primitive software rasterizer functions (sub-1MB footprint, zero GPU driver overhead)
void sap_ui_clear(SapCanvas* c, uint32_t color);
void sap_ui_draw_rect(SapCanvas* c, int x, int y, int w, int h, uint32_t color);
void sap_ui_draw_rounded_rect(SapCanvas* c, int x, int y, int w, int h, int radius, uint32_t color);
void sap_ui_draw_char(SapCanvas* c, int x, int y, char ch, uint32_t color, int scale);
void sap_ui_draw_text(SapCanvas* c, int x, int y, const char* text, uint32_t color, int scale);
void sap_ui_draw_card(SapCanvas* c, int x, int y, int w, int h, const char* title, const char* body, uint32_t accent_color);
void sap_ui_draw_button(SapCanvas* c, int x, int y, int w, int h, const char* label, bool active, uint32_t color);

// Window and widget system
int sap_ui_window_init(SapWindow* win, const char* app_id, const char* title, uint32_t w, uint32_t h);
int sap_ui_window_resize(SapWindow* win, uint32_t w, uint32_t h);
int sap_ui_window_render_dashboard(SapWindow* win,
                                   const char* ai_status,
                                   const char* rootfs_status,
                                   const char* telephony_status,
                                   const char* camera_status,
                                   const char* compat_status);
int sap_ui_window_commit(SapWindow* win, SapCompositor* comp);
void sap_ui_window_destroy(SapWindow* win);

#ifdef __cplusplus
}
#endif

#endif // SAP_UI_H
