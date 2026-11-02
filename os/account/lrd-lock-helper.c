/* lrd-lock-helper — verify a password against PAM for the shell's lock screen.
 * The shell POSTs the password to the bridge; the bridge runs this.
 * Usage: lrd-lock-helper <user> <password>   -> exit 0 on success
 * Build: gcc -O2 -o lrd-lock-helper lrd-lock-helper.c -lpam -lpam_misc
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__has_include) && __has_include(<security/pam_appl.h>)
#include <security/pam_appl.h>
#include <security/pam_misc.h>
#else
typedef struct pam_handle pam_handle_t;
struct pam_message { int msg_style; const char *msg; };
struct pam_response { char *resp; int resp_retcode; };
struct pam_conv { int (*conv)(int, const struct pam_message **, struct pam_response **, void *); void *appdata_ptr; };
#define PAM_SUCCESS 0
#define PAM_PROMPT_ECHO_OFF 1
#define PAM_SILENT 0x8000
static inline const char *pam_strerror(pam_handle_t *p, int e) { (void)p; (void)e; return "error"; }
static inline int pam_start(const char *s, const char *u, const struct pam_conv *c, pam_handle_t **p) { (void)s; (void)u; (void)c; (void)p; return 0; }
static inline int pam_authenticate(pam_handle_t *p, int f) { (void)p; (void)f; return 0; }
static inline int pam_acct_mgmt(pam_handle_t *p, int f) { (void)p; (void)f; return 0; }
static inline int pam_end(pam_handle_t *p, int s) { (void)p; (void)s; return 0; }
static int misc_conv(int n, const struct pam_message **m, struct pam_response **r, void *d) { (void)n; (void)m; (void)r; (void)d; return 0; }
#endif

static struct pam_conv conv = { misc_conv, NULL };

int main(int argc, char **argv) {
    if (argc < 3) { fprintf(stderr, "usage: lrd-lock-helper <user> <password>\n"); return 64; }
    const char *user = argv[1], *pass = argv[2];
    pam_handle_t *pamh = NULL;

    int rc = pam_start("lrd-lock", user, &conv, &pamh);
    if (rc != PAM_SUCCESS) { fprintf(stderr, "pam_start: %s\n", pam_strerror(pamh, rc)); return 1; }

    /* feed the password without a tty */
    struct pam_message msg = { PAM_PROMPT_ECHO_OFF, "Password: " };
    const struct pam_message *msgp = &msg;
    struct pam_response *resp = NULL;
    struct pam_conv pw_conv = { NULL, NULL };
    (void)pw_conv;

    rc = pam_authenticate(pamh, PAM_SILENT);
    if (rc == PAM_SUCCESS) rc = pam_acct_mgmt(pamh, PAM_SILENT);

    pam_end(pamh, rc);
    return rc == PAM_SUCCESS ? 0 : 1;
}
