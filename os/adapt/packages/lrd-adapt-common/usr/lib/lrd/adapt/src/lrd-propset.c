/* lrd-propset — set Android system properties from a glibc process.
 *
 * Android properties live in a shared mapping at /dev/__properties__. No vendor init
 * runs under Halium, so the area is empty and every HAL falls back to compiled-in
 * defaults. This helper creates/attaches to the area using the VENDOR's own libc (so
 * the layout matches) and writes the properties the blobs expect.
 *
 * Build: gcc -O2 -o lrd-propset lrd-propset.c -ldl
 * Usage: lrd-propset KEY VALUE | --file f | --get K | --list | --force | --check
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dlfcn.h>
#include <unistd.h>
#include <errno.h>

typedef int  (*area_init_t)(void);
typedef int  (*prop_set_t)(const char *, const char *);
typedef int  (*prop_get_t)(const char *, char *);
typedef void *(*prop_find_t)(const char *);
typedef int  (*prop_update_t)(void *, const char *, unsigned int);
typedef const char *(*prop_name_t)(const void *);
typedef const char *(*prop_value_t)(const void *);
typedef unsigned (*prop_serial_t)(void);

static void *h;
static prop_set_t    p_set;
static prop_get_t    p_get;
static prop_find_t   p_find;
static prop_update_t p_update;
static prop_serial_t p_serial;

static const char *LIBC_CANDIDATES[] = {
  "/system/lib64/libc.so", "/vendor/lib64/libc.so",
  "/apex/com.android.runtime/lib64/bionic/libc.so",
  "/system/lib/libc.so", "/vendor/lib/libc.so",
  NULL
};

static int load(void) {
  for (int i = 0; LIBC_CANDIDATES[i]; i++) {
    h = dlopen(LIBC_CANDIDATES[i], RTLD_NOW | RTLD_GLOBAL);
    if (h) break;
  }
  if (!h) { fprintf(stderr, "lrd-propset: no vendor libc found\n"); return -1; }
  area_init_t a_init = (area_init_t)dlsym(h, "__system_property_area_init");
  p_set    = (prop_set_t)   dlsym(h, "__system_property_set");
  p_get    = (prop_get_t)   dlsym(h, "__system_property_get");
  p_find   = (prop_find_t)  dlsym(h, "__system_property_find");
  p_update = (prop_update_t)dlsym(h, "__system_property_update");
  p_serial = (prop_serial_t)dlsym(h, "__system_property_serial");
  /* create the area if we are the first process — which, with no vendor init, we are */
  if (a_init) a_init();
  if (!p_set || !p_get) { fprintf(stderr, "lrd-propset: libc lacks property symbols\n"); return -1; }
  return 0;
}

static int set_prop(const char *k, const char *v, int force) {
  if (!force) return p_set(k, v);
  /* ro.* is write-once; if a HAL already claimed it, update the existing record */
  void *pi = p_find ? p_find(k) : NULL;
  if (!pi) return p_set(k, v);
  char cur[256] = {0};
  p_get(k, cur);
  if (strcmp(cur, v) == 0) return 0;
  if (p_update) return p_update(pi, v, (unsigned)strlen(v));
  return p_set(k, v);
}

static void get_prop(const char *k) {
  char buf[4096] = {0};
  p_get(k, buf);
  puts(buf);
}

static int apply_file(const char *path, int force, int quiet) {
  FILE *f = fopen(path, "r");
  if (!f) { fprintf(stderr, "lrd-propset: cannot open %s\n", path); return 1; }
  char line[8192]; int n = 0, fail = 0;
  while (fgets(line, sizeof line, f)) {
    char *p = line;
    while (*p == ' ' || *p == '\t') p++;
    if (*p == '#' || *p == '\n' || *p == '\0') continue;
    char *eq = strchr(p, '=');
    if (!eq) continue;
    *eq = '\0';
    char *k = p, *v = eq + 1;
    size_t vl = strlen(v);
    while (vl && (v[vl-1] == '\n' || v[vl-1] == '\r')) v[--vl] = '\0';
    if (!*k) continue;
    if (set_prop(k, v, force) == 0) { n++; if (!quiet) printf("%s=%s\n", k, v); }
    else { fail++; if (!quiet) fprintf(stderr, "  failed: %s\n", k); }
  }
  fclose(f);
  fprintf(stderr, "lrd-propset: applied %d, failed %d from %s\n", n, fail, path);
  return fail ? 2 : 0;
}

int main(int argc, char **argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: lrd-propset KEY VALUE | --file F | --get K | --list | --check\n");
    return 64;
  }
  if (strcmp(argv[1], "--check") == 0) {
    if (load() != 0) return 1;
    printf("libc=%s set=%p get=%p find=%p update=%p\n", LIBC_CANDIDATES[0], (void*)p_set, (void*)p_get, (void*)p_find, (void*)p_update);
    return 0;
  }
  if (load() != 0) return 1;

  if (strcmp(argv[1], "--get") == 0 && argc >= 3) { get_prop(argv[2]); return 0; }
  if (strcmp(argv[1], "--file") == 0 && argc >= 3) return apply_file(argv[2], 0, 0);
  if (strcmp(argv[1], "--file-force") == 0 && argc >= 3) return apply_file(argv[2], 1, 0);
  if (strcmp(argv[1], "--file-quiet") == 0 && argc >= 3) return apply_file(argv[2], 0, 1);
  if (strcmp(argv[1], "--list") == 0) {
    /* no iterator in bionic's public ABI; read the source files instead */
    const char *files[] = {"/system/build.prop","/vendor/build.prop","/odm/etc/build.prop",NULL};
    for (int i = 0; files[i]; i++) { FILE *f = fopen(files[i], "r"); if (!f) continue; char l[4096];
      while (fgets(l, sizeof l, f)) { if (l[0]=='#'||l[0]=='\n') continue; fputs(l, stdout); } fclose(f); }
    return 0;
  }
  if (argc >= 3) { int r = set_prop(argv[1], argv[2], 0); return r == 0 ? 0 : 1; }
  return 64;
}
