#!/bin/sh

set -eu

if [ "${KAMRA_AUTO_SEED:-0}" = "1" ]; then
  node dist/api/scripts/container-bootstrap.js
fi

exec node dist/api/scripts/container-server.js
