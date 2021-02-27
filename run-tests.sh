#!/usr/bin/env bash
set -e
node dist/api/api.js "./**/!(*.type).test.js"
node dist/tests/isolated-tests/api-test.js
node dist/tests/isolated-tests/api-format-test.js

set +e
node dist/api/tests/isolated-tests/unresolvable-promise-test.js >/dev/null 2>&1
if [ $? -eq 0 ] ; then
    echo "unresolvable-promise-test did throw throw an error as it should"
    exit 1
fi
