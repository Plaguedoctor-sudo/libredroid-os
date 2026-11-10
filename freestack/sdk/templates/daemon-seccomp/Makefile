CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -D_FORTIFY_SOURCE=2 -fstack-protector-strong -fPIE
LDFLAGS ?= -Wl,-z,relro,-z,now -pie

FS_SDK ?= ../..
INCLUDES = -I$(FS_SDK)/sysroot/usr/include -I$(FS_SDK)/../keystore/include
LIBS = $(FS_SDK)/sysroot/usr/lib/libfskeystore.a

TARGET = sample-daemon

all: $(TARGET)

$(TARGET): src/daemon.c
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ src/daemon.c $(LIBS) $(LDFLAGS)

clean:
	rm -f $(TARGET)

.PHONY: all clean
