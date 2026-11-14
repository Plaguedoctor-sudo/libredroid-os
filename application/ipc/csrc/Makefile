CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread -lm

OBJS = sap_ipc_router.o

all: libsap_ipc_router.a sap_ipc_router

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_ipc_router.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_ipc_router: main_router.o libsap_ipc_router.a
	$(CC) $(CFLAGS) main_router.o libsap_ipc_router.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_ipc_router

.PHONY: all clean
