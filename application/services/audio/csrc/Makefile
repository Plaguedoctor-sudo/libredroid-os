CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I.
LDFLAGS ?= -pthread -lm

OBJS = sap_audio.o

all: libsap_audio.a sap_audio_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_audio.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_audio_bench: sap_audio_bench.o libsap_audio.a
	$(CC) $(CFLAGS) sap_audio_bench.o libsap_audio.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_audio_bench

.PHONY: all clean
