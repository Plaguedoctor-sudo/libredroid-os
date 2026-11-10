# SPDX-License-Identifier: GPL-3.0-or-later
CC ?= gcc
CFLAGS ?= -Wall -Wextra -O2 -fPIC -Iinclude
LDFLAGS ?=

all: libfskeystore.so libfskeystore.a fskeystored test_keystore

libfskeystore.so: src/fskeystore.c
	$(CC) $(CFLAGS) -shared -o $@ $^

libfskeystore.a: src/fskeystore.o
	ar rcs $@ $^

src/fskeystore.o: src/fskeystore.c
	$(CC) $(CFLAGS) -c -o $@ $<

fskeystored: src/fskeystored.c
	$(CC) $(CFLAGS) -o $@ $^

test_keystore: tests/test_keystore.c libfskeystore.a
	$(CC) $(CFLAGS) -o $@ tests/test_keystore.c -L. -l:libfskeystore.a

test: all
	@echo "Testing keystore daemon and client..."
	@rm -f /tmp/fs_keystore_test.sock
	@./fskeystored /tmp/fs_keystore_test.sock & PID=$$!; \
	sleep 0.2; \
	./test_keystore /tmp/fs_keystore_test.sock; \
	RET=$$?; \
	kill $$PID 2>/dev/null || true; \
	rm -f /tmp/fs_keystore_test.sock; \
	exit $$RET

clean:
	rm -f src/*.o *.so *.a fskeystored test_keystore /tmp/fs_keystore_test.sock

.PHONY: all test clean
