CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Werror -fPIC -I.
AR ?= ar

all: libsap_notifications.a sap_notifications_bench

sap_notifications.o: sap_notifications.c sap_notifications.h
	$(CC) $(CFLAGS) -c sap_notifications.c -o sap_notifications.o

libsap_notifications.a: sap_notifications.o
	$(AR) rcs libsap_notifications.a sap_notifications.o

sap_notifications_bench: sap_notifications_bench.c libsap_notifications.a
	$(CC) $(CFLAGS) sap_notifications_bench.c -L. -lsap_notifications -o sap_notifications_bench

clean:
	rm -f *.o *.a sap_notifications_bench

.PHONY: all clean
