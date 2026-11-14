CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
LDFLAGS ?= -lm
AR ?= ar

all: libsap_sensors.a sap_sensors_bench

sap_sensors.o: sap_sensors.c sap_sensors.h
	$(CC) $(CFLAGS) -c sap_sensors.c -o sap_sensors.o

libsap_sensors.a: sap_sensors.o
	$(AR) rcs libsap_sensors.a sap_sensors.o

sap_sensors_bench: sap_sensors_bench.c libsap_sensors.a
	$(CC) $(CFLAGS) sap_sensors_bench.c -L. -lsap_sensors $(LDFLAGS) -o sap_sensors_bench

clean:
	rm -f *.o *.a sap_sensors_bench

.PHONY: all clean
