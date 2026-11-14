CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread -lm

OBJS = sap_compositor.o sap_ui.o

all: libsap_compositor.a sap_compositor_bench sap_ui_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_compositor.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_compositor_bench: main_compositor.o libsap_compositor.a
	$(CC) $(CFLAGS) main_compositor.o libsap_compositor.a $(LDFLAGS) -o $@

sap_ui_bench: main_ui.o libsap_compositor.a
	$(CC) $(CFLAGS) main_ui.o libsap_compositor.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_compositor_bench sap_ui_bench

.PHONY: all clean
