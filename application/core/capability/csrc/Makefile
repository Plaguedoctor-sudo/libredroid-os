CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_capability.a sap_capability_bench

sap_capability.o: sap_capability.c sap_capability.h
	$(CC) $(CFLAGS) -c sap_capability.c -o sap_capability.o

libsap_capability.a: sap_capability.o
	$(AR) rcs libsap_capability.a sap_capability.o

sap_capability_bench: sap_capability_bench.c libsap_capability.a
	$(CC) $(CFLAGS) sap_capability_bench.c -L. -lsap_capability -o sap_capability_bench

clean:
	rm -f *.o *.a sap_capability_bench

.PHONY: all clean
