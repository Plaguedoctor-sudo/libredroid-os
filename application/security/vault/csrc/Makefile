CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_vault.a sap_vault_bench

sap_vault.o: sap_vault.c sap_vault.h
	$(CC) $(CFLAGS) -c sap_vault.c -o sap_vault.o

libsap_vault.a: sap_vault.o
	$(AR) rcs libsap_vault.a sap_vault.o

sap_vault_bench: sap_vault_bench.c libsap_vault.a
	$(CC) $(CFLAGS) sap_vault_bench.c -L. -lsap_vault -o sap_vault_bench

clean:
	rm -f *.o *.a sap_vault_bench

.PHONY: all clean
