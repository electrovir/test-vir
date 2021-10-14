#!/usr/bin/env bash
set -e;

cliPath="dist/api/cli.js"

node "$cliPath" "./**/!(*.type).test.js";
node dist/tests/isolated-tests/api-test.js;
node dist/tests/isolated-tests/api-format-test.js;

set +e;
# check unresolved promises
checkFile="dist/tests/isolated-tests/input-files/unresolvable-promise-input.js";
node "$cliPath" "$checkFile" >/dev/null 2>&1;
if [ $? -eq 0 ]; then
    echo "unresolvable-promise-test did throw throw an error as it should";
    exit 1;
fi
if [ ! -f "$checkFile" ]; then
    echo "$checkFile file was not found for the test!";
    exit 1;
fi

# check the debug flag
checkFile="dist/tests/isolated-tests/input-files/force-only-input.js";
output=$(node "$cliPath" --debug "$checkFile");
if [ ${#output} -le 6000 ]; then
    echo "vvv begin incorrect debug output vvv"
    echo "$output"
    echo "^^^ end incorrect debug output ^^^"
    echo ${#output}
    echo "debug flag did not produce tons of output";
    exit 1;
fi