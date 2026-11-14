CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I. -I../../audio/csrc
LDFLAGS ?= -pthread -lm

OBJS = sap_telephony.o

all: libsap_telephony.a sap_telephony_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_telephony.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_telephony_bench: main_telephony.o libsap_telephony.a
	$(MAKE) -C ../../audio/csrc
	$(CC) $(CFLAGS) main_telephony.o libsap_telephony.a ../../audio/csrc/libsap_audio.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_telephony_bench
	$(MAKE) -C ../../audio/csrc clean

.PHONY: all clean
