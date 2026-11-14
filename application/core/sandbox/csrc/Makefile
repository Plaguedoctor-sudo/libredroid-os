CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread

OBJS = sap_sandbox.o

all: libsap_sandbox.a sap_sandbox_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_sandbox.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_sandbox_bench: main_sandbox.o libsap_sandbox.a
	$(CC) $(CFLAGS) main_sandbox.o libsap_sandbox.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_sandbox_bench

.PHONY: all clean
