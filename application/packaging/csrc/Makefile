CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread

OBJS = sap_packaging.o

all: libsap_packaging.a sap_packaging_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_packaging.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_packaging_bench: main_packaging.o libsap_packaging.a
	$(CC) $(CFLAGS) main_packaging.o libsap_packaging.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_packaging_bench

.PHONY: all clean
