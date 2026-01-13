#!/bin/bash
# Type check script that excludes errors from src/components/ui (auto-generated shadcn/ui files)

OUTPUT=$(tsc --noEmit -p tsconfig.json 2>&1)
EXIT_CODE=$?

# Filter out errors from src/components/ui
FILTERED_OUTPUT=$(echo "$OUTPUT" | grep -v 'src/components/ui')

# Check if there are any errors remaining (excluding src/components/ui)
if echo "$FILTERED_OUTPUT" | grep -q 'error TS'; then
  echo "$FILTERED_OUTPUT"
  exit 1
fi

# If no errors (or only src/components/ui errors), exit with success
exit 0
