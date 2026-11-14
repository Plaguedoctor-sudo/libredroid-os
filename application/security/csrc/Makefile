CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_security.a sap_security_bench

sap_telemetry_poison.o: sap_telemetry_poison.c sap_security.h
	$(CC) $(CFLAGS) -c sap_telemetry_poison.c -o sap_telemetry_poison.o

sap_anti_predatory.o: sap_anti_predatory.c sap_security.h
	$(CC) $(CFLAGS) -c sap_anti_predatory.c -o sap_anti_predatory.o

libsap_security.a: sap_telemetry_poison.o sap_anti_predatory.o
	$(AR) rcs libsap_security.a sap_telemetry_poison.o sap_anti_predatory.o

sap_security_bench: sap_security_bench.c libsap_security.a
	$(CC) $(CFLAGS) sap_security_bench.c -L. -lsap_security -o sap_security_bench

clean:
	rm -f *.o *.a sap_security_bench

.PHONY: all clean
