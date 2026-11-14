CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -pthread -fPIC -I. -I../android/csrc -I../translation/csrc
LDFLAGS ?= -pthread

OBJS = ../android/csrc/sap_compat_android.o ../translation/csrc/sap_translation.o

all: libsap_compat.a sap_compat_bench

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

../android/csrc/sap_compat_android.o: ../android/csrc/sap_compat_android.c
	$(CC) $(CFLAGS) -c $< -o $@

../translation/csrc/sap_translation.o: ../translation/csrc/sap_translation.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_compat.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_compat_bench: main_compat.o libsap_compat.a
	$(CC) $(CFLAGS) main_compat.o libsap_compat.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_compat_bench ../android/csrc/*.o ../translation/csrc/*.o

.PHONY: all clean
