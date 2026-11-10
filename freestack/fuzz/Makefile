# SPDX-License-Identifier: GPL-3.0-or-later
CC ?= gcc
CXX ?= g++
CXXFLAGS ?= -O2 -Wall -Wextra -DFUZZ_STANDALONE_MAIN

HARNESSES = manifest_parser_fuzz_bin keystore_ipc_fuzz_bin verity_metadata_fuzz_bin

all: $(HARNESSES)

manifest_parser_fuzz_bin: manifest_parser_fuzz.cc
	$(CXX) $(CXXFLAGS) -o $@ $<

keystore_ipc_fuzz_bin: keystore_ipc_fuzz.cc
	$(CXX) $(CXXFLAGS) -o $@ $<

verity_metadata_fuzz_bin: verity_metadata_fuzz.cc
	$(CXX) $(CXXFLAGS) -o $@ $<

clean:
	rm -f $(HARNESSES) *.o
	rm -rf crashes/ corpus/

.PHONY: all clean
