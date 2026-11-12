// SPDX-License-Identifier: LGPL-2.1-or-later
#ifndef _GLIB_OBJECT_H_
#define _GLIB_OBJECT_H_

#include <stddef.h>
#include <stdint.h>

typedef int gboolean;
#define TRUE 1
#define FALSE 0
typedef int gint;
typedef char gchar;
typedef unsigned long GType;

typedef struct _GTypeInstance GTypeInstance;
typedef struct _GTypeClass GTypeClass;

struct _GTypeInstance {
    GTypeClass *g_class;
};
struct _GTypeClass {
    GType g_type;
};

#define G_DECLARE_FINAL_TYPE(ModuleObjName, module_obj_name, MODULE, OBJ_NAME, ParentName) \
    typedef struct _##ModuleObjName ModuleObjName; \
    typedef struct { ParentName##Class parent_class; } ModuleObjName##Class; \
    static inline GType module_obj_name##_get_type(void) { return 0x1000; }

#define G_DEFINE_TYPE_WITH_CODE(TN, t_n, T_P, _C_) \
    static void t_n##_init(TN *self); \
    static void t_n##_class_init(TN##Class *klass);

#define G_IMPLEMENT_INTERFACE(TYPE_IFACE, iface_init)

static inline void *g_object_new(GType gtype, const char *first_prop, ...) {
    (void)gtype; (void)first_prop; return NULL;
}

#endif
