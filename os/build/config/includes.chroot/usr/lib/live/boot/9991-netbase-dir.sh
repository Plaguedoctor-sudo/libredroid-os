#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Ensure /root/etc/network directory exists for Debian network configuration
[ -d /root/etc ] && mkdir -p /root/etc/network
