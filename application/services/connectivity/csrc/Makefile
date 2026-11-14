CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_connectivity.a sap_connectivity_bench

sap_connectivity.o: sap_connectivity.c sap_connectivity.h
	$(CC) $(CFLAGS) -c sap_connectivity.c -o sap_connectivity.o

libsap_connectivity.a: sap_connectivity.o
	$(AR) rcs libsap_connectivity.a sap_connectivity.o

sap_connectivity_bench: sap_connectivity_bench.c libsap_connectivity.a
	$(CC) $(CFLAGS) sap_connectivity_bench.c -L. -lsap_connectivity -o sap_connectivity_bench

clean:
	rm -f *.o *.a sap_connectivity_bench

.PHONY: all clean
