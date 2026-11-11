# SPDX-License-Identifier: GPL-3.0-or-later
FROM gcr.io/oss-fuzz-base/base-builder:v1
RUN apt-get update && apt-get install -y build-essential make libseccomp-dev
COPY . $SRC/freestack
WORKDIR $SRC/freestack
COPY .clusterfuzzlite/build.sh $SRC/build.sh
