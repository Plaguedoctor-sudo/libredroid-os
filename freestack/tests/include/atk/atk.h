// SPDX-License-Identifier: LGPL-2.1-or-later
#ifndef _ATK_ATK_H_
#define _ATK_ATK_H_

#include "glib-object.h"

typedef struct _AtkObject AtkObject;
typedef struct _AtkObjectClass AtkObjectClass;
typedef struct _AtkAction AtkAction;
typedef struct _AtkActionIface AtkActionIface;
typedef struct _AtkComponent AtkComponent;
typedef struct _AtkComponentIface AtkComponentIface;

struct _AtkObject {
    GTypeInstance parent;
};
struct _AtkObjectClass {
    GTypeClass parent_class;
};

struct _AtkActionIface {
    GTypeClass parent;
    gboolean (*do_action)(AtkAction *action, gint i);
    gint (*get_n_actions)(AtkAction *action);
    const gchar *(*get_name)(AtkAction *action, gint i);
    const gchar *(*get_description)(AtkAction *action, gint i);
};

struct _AtkComponentIface {
    GTypeClass parent;
};

#define ATK_TYPE_OBJECT (0x1001UL)
#define ATK_TYPE_ACTION (0x1002UL)
#define ATK_TYPE_COMPONENT (0x1003UL)
#define ATK_ROLE_PUSH_BUTTON 1

#define ATK_OBJECT(obj) ((AtkObject *)(obj))

static inline void atk_object_set_role(AtkObject *accessible, int role) { (void)accessible; (void)role; }
static inline void atk_object_set_name(AtkObject *accessible, const gchar *name) { (void)accessible; (void)name; }
static inline void atk_object_set_description(AtkObject *accessible, const gchar *description) { (void)accessible; (void)description; }

#endif
