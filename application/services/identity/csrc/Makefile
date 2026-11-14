CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_identity.a sap_identity_bench

sap_identity.o: sap_identity.c sap_identity.h
	$(CC) $(CFLAGS) -c sap_identity.c -o sap_identity.o

libsap_identity.a: sap_identity.o
	$(AR) rcs libsap_identity.a sap_identity.o

sap_identity_bench: sap_identity_bench.c libsap_identity.a
	$(CC) $(CFLAGS) sap_identity_bench.c -L. -lsap_identity -o sap_identity_bench

clean:
	rm -f *.o *.a sap_identity_bench

.PHONY: all clean
