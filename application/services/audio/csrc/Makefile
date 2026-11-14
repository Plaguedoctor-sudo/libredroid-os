CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread -lm

OBJS = sap_audio.o

all: libsap_audio.a

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_audio.a: $(OBJS)
	ar rcs $@ $(OBJS)

clean:
	rm -f *.o *.a

.PHONY: all clean
