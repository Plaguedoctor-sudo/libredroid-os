CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I. -I../../core/sandbox/csrc -I../../packaging/csrc
LDFLAGS ?= -pthread

all: sapp

sapp: csrc/sapp.c ../../core/sandbox/csrc/libsap_sandbox.a ../../packaging/csrc/libsap_packaging.a
	$(CC) $(CFLAGS) csrc/sapp.c ../../core/sandbox/csrc/libsap_sandbox.a ../../packaging/csrc/libsap_packaging.a $(LDFLAGS) -o $@

clean:
	rm -f sapp

.PHONY: all clean
