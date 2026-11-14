CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread -lm

OBJS = sap_camera.o sap_camera_daemon.o

all: libsap_camera.a sap_camera_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_camera.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_camera_bench: main_camera.o libsap_camera.a
	$(CC) $(CFLAGS) main_camera.o libsap_camera.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_camera_bench

.PHONY: all clean
