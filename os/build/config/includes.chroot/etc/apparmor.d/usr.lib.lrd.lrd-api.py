#include <tunables/global>
/usr/lib/lrd/lrd-api.py {
  #include <abstractions/base>
  #include <abstractions/python>
  /usr/bin/lrd-* rix,
  /run/lrd/ rw,
  /run/lrd/* rw,
  /proc/*/status r,
  network inet stream,
}
