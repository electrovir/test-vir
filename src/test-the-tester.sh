#!/usr/bin/env bash 

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

runTestFile () {
    node "$1";
}

# find all the .test.js files (TypeScript compilation must happen before this script runs) and run
# the script using node
find "$scriptDir/../dist" -name "*.test.js" -print0 | while IFS= read -r -d '' file; do runTestFile "$file"; done
