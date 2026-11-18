#define _GNU_SOURCE
#include <sys/types.h>
#include <sys/stat.h>
#include <time.h>
#include <sys/time.h>
#include <dlfcn.h>
#include <stdlib.h>

static time_t get_fixed_time(void) {
    const char *e = getenv("SOURCE_DATE_EPOCH");
    return e ? (time_t)atol(e) : 1700000000;
}

time_t time(time_t *tloc) {
    time_t t = get_fixed_time();
    if (tloc) *tloc = t;
    return t;
}

int gettimeofday(struct timeval *tv, void *tz) {
    if (tv) {
        tv->tv_sec = get_fixed_time();
        tv->tv_usec = 0;
    }
    return 0;
}

int clock_gettime(clockid_t clk_id, struct timespec *tp) {
    if (tp) {
        tp->tv_sec = get_fixed_time();
        tp->tv_nsec = 0;
    }
    return 0;
}

int lstat64(const char *pathname, struct stat64 *statbuf) {
    static int (*orig)(const char *, struct stat64 *) = NULL;
    if (!orig) orig = dlsym(RTLD_NEXT, "lstat64");
    int ret = orig(pathname, statbuf);
    if (ret == 0 && statbuf) {
        statbuf->st_ctime = statbuf->st_mtime;
        statbuf->st_ctim.tv_sec = statbuf->st_mtim.tv_sec;
        statbuf->st_ctim.tv_nsec = 0;
        statbuf->st_mtim.tv_nsec = 0;
        statbuf->st_atim.tv_nsec = 0;
    }
    return ret;
}

int stat(const char *pathname, struct stat *statbuf) {
    static int (*orig)(const char *, struct stat *) = NULL;
    if (!orig) orig = dlsym(RTLD_NEXT, "stat");
    int ret = orig(pathname, statbuf);
    if (ret == 0 && statbuf) {
        statbuf->st_ctime = statbuf->st_mtime;
        statbuf->st_ctim.tv_sec = statbuf->st_mtim.tv_sec;
        statbuf->st_ctim.tv_nsec = 0;
        statbuf->st_mtim.tv_nsec = 0;
        statbuf->st_atim.tv_nsec = 0;
    }
    return ret;
}

int fstat64(int fd, struct stat64 *statbuf) {
    static int (*orig)(int, struct stat64 *) = NULL;
    if (!orig) orig = dlsym(RTLD_NEXT, "fstat64");
    int ret = orig(fd, statbuf);
    if (ret == 0 && statbuf) {
        statbuf->st_ctime = statbuf->st_mtime;
        statbuf->st_ctim.tv_sec = statbuf->st_mtim.tv_sec;
        statbuf->st_ctim.tv_nsec = 0;
        statbuf->st_mtim.tv_nsec = 0;
        statbuf->st_atim.tv_nsec = 0;
    }
    return ret;
}
