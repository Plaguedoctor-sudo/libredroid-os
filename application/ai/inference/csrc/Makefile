CC ?= gcc
CFLAGS ?= -O3 -Wall -Wextra -mavx2 -mfma -fopenmp -fPIC -I.
LDFLAGS ?= -fopenmp -lm

OBJS = sap_tensor_int4.o sap_transformer.o

all: libsap_ai_int4.a sap_bench_int4

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

libsap_ai_int4.a: $(OBJS)
	ar rcs $@ $(OBJS)

sap_bench_int4: main_bench.o libsap_ai_int4.a
	$(CC) $(CFLAGS) main_bench.o libsap_ai_int4.a $(LDFLAGS) -o $@

clean:
	rm -f *.o *.a sap_bench_int4

.PHONY: all clean
