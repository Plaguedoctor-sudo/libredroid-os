CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_power.a sap_power_bench

sap_power.o: sap_power.c sap_power.h
	$(CC) $(CFLAGS) -c sap_power.c -o sap_power.o

libsap_power.a: sap_power.o
	$(AR) rcs libsap_power.a sap_power.o

sap_power_bench: sap_power_bench.c libsap_power.a
	$(CC) $(CFLAGS) sap_power_bench.c -L. -lsap_power -o sap_power_bench

clean:
	rm -f *.o *.a sap_power_bench

.PHONY: all clean
