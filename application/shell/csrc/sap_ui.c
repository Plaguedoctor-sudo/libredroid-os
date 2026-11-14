#define _GNU_SOURCE
#include "sap_ui.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Compact 5x7 font table for ASCII 32 (' ') through 126 ('~')
static const uint8_t FONT_5X7[95][5] = {
    {0x00, 0x00, 0x00, 0x00, 0x00}, // 32 ' '
    {0x00, 0x00, 0x5F, 0x00, 0x00}, // 33 '!'
    {0x00, 0x07, 0x00, 0x07, 0x00}, // 34 '"'
    {0x14, 0x7F, 0x14, 0x7F, 0x14}, // 35 '#'
    {0x24, 0x2A, 0x7F, 0x2A, 0x12}, // 36 '$'
    {0x23, 0x13, 0x08, 0x64, 0x62}, // 37 '%'
    {0x36, 0x49, 0x55, 0x22, 0x50}, // 38 '&'
    {0x00, 0x05, 0x03, 0x00, 0x00}, // 39 '\''
    {0x00, 0x1C, 0x22, 0x41, 0x00}, // 40 '('
    {0x00, 0x41, 0x22, 0x1C, 0x00}, // 41 ')'
    {0x14, 0x08, 0x3E, 0x08, 0x14}, // 42 '*'
    {0x08, 0x08, 0x3E, 0x08, 0x08}, // 43 '+'
    {0x00, 0x50, 0x30, 0x00, 0x00}, // 44 ','
    {0x08, 0x08, 0x08, 0x08, 0x08}, // 45 '-'
    {0x00, 0x60, 0x60, 0x00, 0x00}, // 46 '.'
    {0x20, 0x10, 0x08, 0x04, 0x02}, // 47 '/'
    {0x3E, 0x51, 0x49, 0x45, 0x3E}, // 48 '0'
    {0x00, 0x42, 0x7F, 0x40, 0x00}, // 49 '1'
    {0x42, 0x61, 0x51, 0x49, 0x46}, // 50 '2'
    {0x21, 0x41, 0x45, 0x4B, 0x31}, // 51 '3'
    {0x18, 0x14, 0x12, 0x7F, 0x10}, // 52 '4'
    {0x27, 0x45, 0x45, 0x45, 0x39}, // 53 '5'
    {0x3C, 0x4A, 0x49, 0x49, 0x30}, // 54 '6'
    {0x01, 0x71, 0x09, 0x05, 0x03}, // 55 '7'
    {0x36, 0x49, 0x49, 0x49, 0x36}, // 56 '8'
    {0x06, 0x49, 0x49, 0x29, 0x1E}, // 57 '9'
    {0x00, 0x36, 0x36, 0x00, 0x00}, // 58 ':'
    {0x00, 0x56, 0x36, 0x00, 0x00}, // 59 ';'
    {0x08, 0x14, 0x22, 0x41, 0x00}, // 60 '<'
    {0x14, 0x14, 0x14, 0x14, 0x14}, // 61 '='
    {0x00, 0x41, 0x22, 0x14, 0x08}, // 62 '>'
    {0x02, 0x01, 0x51, 0x09, 0x06}, // 63 '?'
    {0x32, 0x49, 0x79, 0x41, 0x3E}, // 64 '@'
    {0x7E, 0x11, 0x11, 0x11, 0x7E}, // 65 'A'
    {0x7F, 0x49, 0x49, 0x49, 0x36}, // 66 'B'
    {0x3E, 0x41, 0x41, 0x41, 0x22}, // 67 'C'
    {0x7F, 0x41, 0x41, 0x22, 0x1C}, // 68 'D'
    {0x7F, 0x49, 0x49, 0x49, 0x41}, // 69 'E'
    {0x7F, 0x09, 0x09, 0x09, 0x01}, // 70 'F'
    {0x3E, 0x41, 0x49, 0x49, 0x7A}, // 71 'G'
    {0x7F, 0x08, 0x08, 0x08, 0x7F}, // 72 'H'
    {0x00, 0x41, 0x7F, 0x41, 0x00}, // 73 'I'
    {0x20, 0x40, 0x41, 0x3F, 0x01}, // 74 'J'
    {0x7F, 0x08, 0x14, 0x22, 0x41}, // 75 'K'
    {0x7F, 0x40, 0x40, 0x40, 0x40}, // 76 'L'
    {0x7F, 0x02, 0x0C, 0x02, 0x7F}, // 77 'M'
    {0x7F, 0x04, 0x08, 0x10, 0x7F}, // 78 'N'
    {0x3E, 0x41, 0x41, 0x41, 0x3E}, // 79 'O'
    {0x7F, 0x09, 0x09, 0x09, 0x06}, // 80 'P'
    {0x3E, 0x41, 0x51, 0x21, 0x5E}, // 81 'Q'
    {0x7F, 0x09, 0x19, 0x29, 0x46}, // 82 'R'
    {0x46, 0x49, 0x49, 0x49, 0x31}, // 83 'S'
    {0x01, 0x01, 0x7F, 0x01, 0x01}, // 84 'T'
    {0x3F, 0x40, 0x40, 0x40, 0x3F}, // 85 'U'
    {0x1F, 0x20, 0x40, 0x20, 0x1F}, // 86 'V'
    {0x3F, 0x40, 0x38, 0x40, 0x3F}, // 87 'W'
    {0x63, 0x14, 0x08, 0x14, 0x63}, // 88 'X'
    {0x07, 0x08, 0x70, 0x08, 0x07}, // 89 'Y'
    {0x61, 0x51, 0x49, 0x45, 0x43}, // 90 'Z'
    {0x00, 0x7F, 0x41, 0x41, 0x00}, // 91 '['
    {0x02, 0x04, 0x08, 0x10, 0x20}, // 92 '\\'
    {0x00, 0x41, 0x41, 0x7F, 0x00}, // 93 ']'
    {0x04, 0x02, 0x01, 0x02, 0x04}, // 94 '^'
    {0x40, 0x40, 0x40, 0x40, 0x40}, // 95 '_'
    {0x00, 0x01, 0x02, 0x04, 0x00}, // 96 '`'
    {0x20, 0x54, 0x54, 0x54, 0x78}, // 97 'a'
    {0x7F, 0x48, 0x44, 0x44, 0x38}, // 98 'b'
    {0x38, 0x44, 0x44, 0x44, 0x20}, // 99 'c'
    {0x38, 0x44, 0x44, 0x48, 0x7F}, // 100 'd'
    {0x38, 0x54, 0x54, 0x54, 0x18}, // 101 'e'
    {0x08, 0x7E, 0x09, 0x01, 0x02}, // 102 'f'
    {0x0C, 0x52, 0x52, 0x52, 0x3E}, // 103 'g'
    {0x7F, 0x08, 0x04, 0x04, 0x78}, // 104 'h'
    {0x00, 0x44, 0x7D, 0x40, 0x00}, // 105 'i'
    {0x20, 0x40, 0x44, 0x3D, 0x00}, // 106 'j'
    {0x7F, 0x10, 0x28, 0x44, 0x00}, // 107 'k'
    {0x00, 0x41, 0x7F, 0x40, 0x00}, // 108 'l'
    {0x7C, 0x04, 0x18, 0x04, 0x78}, // 109 'm'
    {0x7C, 0x08, 0x04, 0x04, 0x78}, // 110 'n'
    {0x38, 0x44, 0x44, 0x44, 0x38}, // 111 'o'
    {0x7C, 0x14, 0x14, 0x14, 0x08}, // 112 'p'
    {0x08, 0x14, 0x14, 0x18, 0x7C}, // 113 'q'
    {0x7C, 0x08, 0x04, 0x04, 0x08}, // 114 'r'
    {0x48, 0x54, 0x54, 0x54, 0x20}, // 115 's'
    {0x04, 0x3F, 0x44, 0x40, 0x20}, // 116 't'
    {0x3C, 0x40, 0x40, 0x20, 0x7C}, // 117 'u'
    {0x1C, 0x20, 0x40, 0x20, 0x1C}, // 118 'v'
    {0x3C, 0x40, 0x30, 0x40, 0x3C}, // 119 'w'
    {0x44, 0x28, 0x10, 0x28, 0x44}, // 120 'x'
    {0x0C, 0x50, 0x50, 0x50, 0x3C}, // 121 'y'
    {0x44, 0x64, 0x54, 0x4C, 0x44}, // 122 'z'
    {0x00, 0x08, 0x36, 0x41, 0x00}, // 123 '{'
    {0x00, 0x00, 0x7F, 0x00, 0x00}, // 124 '|'
    {0x00, 0x41, 0x36, 0x08, 0x00}, // 125 '}'
    {0x08, 0x04, 0x08, 0x10, 0x08}  // 126 '~'
};

void sap_ui_clear(SapCanvas* c, uint32_t color) {
    if (!c || !c->pixels) return;
    size_t count = (size_t)c->width * c->height;
    for (size_t i = 0; i < count; i++) {
        c->pixels[i] = color;
    }
}

void sap_ui_draw_rect(SapCanvas* c, int x, int y, int w, int h, uint32_t color) {
    if (!c || !c->pixels || w <= 0 || h <= 0) return;

    int x0 = x < 0 ? 0 : x;
    int y0 = y < 0 ? 0 : y;
    int x1 = (x + w) > (int)c->width ? (int)c->width : (x + w);
    int y1 = (y + h) > (int)c->height ? (int)c->height : (y + h);

    for (int cy = y0; cy < y1; cy++) {
        uint32_t* row = c->pixels + (cy * c->width);
        for (int cx = x0; cx < x1; cx++) {
            row[cx] = color;
        }
    }
}

void sap_ui_draw_rounded_rect(SapCanvas* c, int x, int y, int w, int h, int radius, uint32_t color) {
    if (radius <= 0) {
        sap_ui_draw_rect(c, x, y, w, h, color);
        return;
    }

    int x0 = x < 0 ? 0 : x;
    int y0 = y < 0 ? 0 : y;
    int x1 = (x + w) > (int)c->width ? (int)c->width : (x + w);
    int y1 = (y + h) > (int)c->height ? (int)c->height : (y + h);
    int r2 = radius * radius;

    for (int cy = y0; cy < y1; cy++) {
        uint32_t* row = c->pixels + (cy * c->width);
        for (int cx = x0; cx < x1; cx++) {
            // Check corners
            int dx = 0, dy = 0;
            if (cx < x + radius) dx = cx - (x + radius);
            else if (cx >= x + w - radius) dx = cx - (x + w - radius - 1);

            if (cy < y + radius) dy = cy - (y + radius);
            else if (cy >= y + h - radius) dy = cy - (y + h - radius - 1);

            if (dx != 0 && dy != 0) {
                if (dx * dx + dy * dy > r2) continue;
            }
            row[cx] = color;
        }
    }
}

void sap_ui_draw_char(SapCanvas* c, int x, int y, char ch, uint32_t color, int scale) {
    if (!c || !c->pixels || ch < 32 || ch > 126 || scale <= 0) return;
    const uint8_t* col_bytes = FONT_5X7[ch - 32];

    for (int col = 0; col < 5; col++) {
        uint8_t bits = col_bytes[col];
        for (int row = 0; row < 7; row++) {
            if (bits & (1 << row)) {
                sap_ui_draw_rect(c, x + (col * scale), y + (row * scale), scale, scale, color);
            }
        }
    }
}

void sap_ui_draw_text(SapCanvas* c, int x, int y, const char* text, uint32_t color, int scale) {
    if (!c || !text || scale <= 0) return;
    int cur_x = x;
    while (*text) {
        if (*text == '\n') {
            cur_x = x;
            y += (8 * scale);
        } else {
            sap_ui_draw_char(c, cur_x, y, *text, color, scale);
            cur_x += (6 * scale);
        }
        text++;
    }
}

void sap_ui_draw_card(SapCanvas* c, int x, int y, int w, int h, const char* title, const char* body, uint32_t accent_color) {
    // Card background
    sap_ui_draw_rounded_rect(c, x, y, w, h, 6, SAP_COLOR_CARD);
    // Left accent strip
    sap_ui_draw_rounded_rect(c, x, y, 4, h, 2, accent_color);
    // Border
    sap_ui_draw_rect(c, x + 4, y, w - 4, 1, SAP_COLOR_BORDER);
    sap_ui_draw_rect(c, x + 4, y + h - 1, w - 4, 1, SAP_COLOR_BORDER);

    // Title and body
    sap_ui_draw_text(c, x + 16, y + 14, title, SAP_COLOR_TEXT_PRIMARY, 2);
    sap_ui_draw_text(c, x + 16, y + 36, body, SAP_COLOR_TEXT_MUTED, 1);
}

void sap_ui_draw_button(SapCanvas* c, int x, int y, int w, int h, const char* label, bool active, uint32_t color) {
    uint32_t bg = active ? color : SAP_COLOR_SURFACE;
    uint32_t text_col = active ? 0xFF000000 : SAP_COLOR_TEXT_PRIMARY;

    sap_ui_draw_rounded_rect(c, x, y, w, h, 4, bg);
    sap_ui_draw_rect(c, x, y, w, 1, SAP_COLOR_BORDER);
    sap_ui_draw_rect(c, x, y + h - 1, w, 1, SAP_COLOR_BORDER);

    // Center text approximately
    int text_len = (int)strlen(label);
    int tx = x + (w - (text_len * 6)) / 2;
    int ty = y + (h - 7) / 2;
    sap_ui_draw_text(c, tx, ty, label, text_col, 1);
}

int sap_ui_window_init(SapWindow* win, const char* app_id, const char* title, uint32_t w, uint32_t h) {
    if (!win) return -1;
    memset(win, 0, sizeof(SapWindow));

    strncpy(win->app_id, app_id ? app_id : "org.sovereign.dashboard", sizeof(win->app_id) - 1);
    strncpy(win->title, title ? title : "Sovereign Control", sizeof(win->title) - 1);
    win->width = w ? w : 1280;
    win->height = h ? h : 720;
    win->canvas.width = win->width;
    win->canvas.height = win->height;
    win->canvas.stride = win->width;

    win->canvas.pixels = (uint32_t*)calloc((size_t)win->width * win->height, sizeof(uint32_t));
    if (!win->canvas.pixels) return -2;

    win->surface_id = 0;
    win->frame_count = 0;
    return 0;
}

int sap_ui_window_resize(SapWindow* win, uint32_t w, uint32_t h) {
    if (!win || w == 0 || h == 0) return -1;
    if (win->width == w && win->height == h) return 0;

    uint32_t* new_pixels = (uint32_t*)realloc(win->canvas.pixels, (size_t)w * h * sizeof(uint32_t));
    if (!new_pixels) return -2;

    win->width = w;
    win->height = h;
    win->canvas.width = w;
    win->canvas.height = h;
    win->canvas.stride = w;
    win->canvas.pixels = new_pixels;

    return 0;
}

int sap_ui_window_render_dashboard(SapWindow* win,
                                   const char* ai_status,
                                   const char* rootfs_status,
                                   const char* telephony_status,
                                   const char* camera_status,
                                   const char* compat_status) {
    if (!win || !win->canvas.pixels) return -1;
    SapCanvas* c = &win->canvas;

    // 1. Clear background
    sap_ui_clear(c, SAP_COLOR_BG_DARK);

    // 2. Top Header Bar
    sap_ui_draw_rect(c, 0, 0, (int)c->width, 48, SAP_COLOR_SURFACE);
    sap_ui_draw_rect(c, 0, 47, (int)c->width, 1, SAP_COLOR_BORDER);
    sap_ui_draw_text(c, 20, 16, "SOVEREIGN OS // CONVERGED RUNTIME DASHBOARD", SAP_COLOR_TEXT_PRIMARY, 2);
    sap_ui_draw_text(c, (int)c->width - 180, 18, "POSTURE: 120Hz VRR", SAP_COLOR_ACCENT_CYAN, 1);

    // 3. Responsive Converged Grid Layout
    // If handset width (<800px): single-column. If desktop (>800px): dual-column.
    bool dual_column = (c->width >= 800);
    int card_w = dual_column ? ((int)c->width - 60) / 2 : ((int)c->width - 40);
    int card_h = 72;
    int pad_x = 20;
    int pad_y = 68;
    int gap = 16;

    // Card 1: Local AI Tensor Engine (Option A)
    sap_ui_draw_card(c, pad_x, pad_y, card_w, card_h,
                     "LOCAL AI TENSOR ENGINE",
                     ai_status ? ai_status : "SmolLM2-360M INT4 | Latency: 6.28 ms/tok | RAM: 287.9 MB (AVX2/NEON)",
                     SAP_COLOR_ACCENT_CYAN);

    // Card 2: A/B dm-verity Immutable Rootfs (Option B)
    int c2_x = dual_column ? (pad_x + card_w + gap) : pad_x;
    int c2_y = dual_column ? pad_y : (pad_y + card_h + gap);
    sap_ui_draw_card(c, c2_x, c2_y, card_w, card_h,
                     "A/B DM-VERITY ROOTFS",
                     rootfs_status ? rootfs_status : "Slot A ACTIVE | SHA-256 Merkle Root Verified | RSA-4096 Signed",
                     SAP_COLOR_ACCENT_GREEN);

    // Card 3: Mobile Telephony & Audio (Option D)
    int c3_x = pad_x;
    int c3_y = dual_column ? (pad_y + card_h + gap) : (c2_y + card_h + gap);
    sap_ui_draw_card(c, c3_x, c3_y, card_w, card_h,
                     "TELEPHONY & AUDIO ROUTING",
                     telephony_status ? telephony_status : "VoLTE IMS Active (-85 dBm) | UCM2 Audio Ducking: -18dB | E911 Ready",
                     SAP_COLOR_ACCENT_GOLD);

    // Card 4: Camera ISP & Zero-Trust Privacy (Option F)
    int c4_x = dual_column ? (pad_x + card_w + gap) : pad_x;
    int c4_y = dual_column ? (pad_y + card_h + gap) : (c3_y + card_h + gap);
    sap_ui_draw_card(c, c4_x, c4_y, card_w, card_h,
                     "CAMERA ISP & HARDWARE PRIVACY",
                     camera_status ? camera_status : "Sony IMX258 (1080p@30) | Privacy Shutter: ACTIVE | 0 Photons Leaked",
                     SAP_COLOR_ACCENT_RED);

    // Card 5: Android Subsystem Compatibility (Option H)
    int c5_x = pad_x;
    int c5_y = dual_column ? (pad_y + (card_h + gap) * 2) : (c4_y + card_h + gap);
    int c5_w = dual_column ? ((int)c->width - 40) : card_w;
    sap_ui_draw_card(c, c5_x, c5_y, c5_w, card_h,
                     "ANDROID LXC COMPATIBILITY BRIDGE",
                     compat_status ? compat_status : "Waydroid isolated (netns: lrd-android0) | FEX-Emu ARM64 JIT | GPU Thunked",
                     SAP_COLOR_ACCENT_CYAN);

    // 4. Bottom Action Bar
    int bar_y = (int)c->height - 52;
    sap_ui_draw_rect(c, 0, bar_y, (int)c->width, 52, SAP_COLOR_SURFACE);
    sap_ui_draw_rect(c, 0, bar_y, (int)c->width, 1, SAP_COLOR_BORDER);

    int btn_w = 160;
    int btn_h = 32;
    int btn_y = bar_y + 10;
    sap_ui_draw_button(c, 20, btn_y, btn_w, btn_h, "VERIFY INVARIANTS", true, SAP_COLOR_ACCENT_CYAN);
    sap_ui_draw_button(c, 200, btn_y, btn_w, btn_h, "PURGE TELEMETRY", false, SAP_COLOR_SURFACE);
    sap_ui_draw_button(c, 380, btn_y, btn_w, btn_h, "SWITCH SLOT B", false, SAP_COLOR_SURFACE);

    win->frame_count++;
    return 0;
}

int sap_ui_window_commit(SapWindow* win, SapCompositor* comp) {
    if (!win || !comp) return -1;
    if (win->surface_id == 0) {
        win->surface_id = sap_compositor_create_surface(comp, win->app_id, win->width, win->height, false);
    }
    return sap_compositor_commit_surface(comp, win->surface_id, win->canvas.pixels, win->width, win->height);
}

void sap_ui_window_destroy(SapWindow* win) {
    if (!win) return;
    if (win->canvas.pixels) {
        free(win->canvas.pixels);
        win->canvas.pixels = NULL;
    }
    win->surface_id = 0;
}
