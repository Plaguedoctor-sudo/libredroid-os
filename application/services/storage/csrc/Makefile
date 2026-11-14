CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_storage.a sap_storage_bench

sap_storage.o: sap_storage.c sap_storage.h
	$(CC) $(CFLAGS) -c sap_storage.c -o sap_storage.o

libsap_storage.a: sap_storage.o
	$(AR) rcs libsap_storage.a sap_storage.o

sap_storage_bench: sap_storage_bench.c libsap_storage.a
	$(CC) $(CFLAGS) sap_storage_bench.c -L. -lsap_storage -o sap_storage_bench

clean:
	rm -f *.o *.a sap_storage_bench

.PHONY: all clean
