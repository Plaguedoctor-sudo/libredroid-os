CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_memory.a sap_memory_bench

sap_memory.o: sap_memory.c sap_memory.h
	$(CC) $(CFLAGS) -c sap_memory.c -o sap_memory.o

libsap_memory.a: sap_memory.o
	$(AR) rcs libsap_memory.a sap_memory.o

sap_memory_bench: sap_memory_bench.c libsap_memory.a
	$(CC) $(CFLAGS) sap_memory_bench.c -L. -lsap_memory -o sap_memory_bench

clean:
	rm -f *.o *.a sap_memory_bench

.PHONY: all clean
