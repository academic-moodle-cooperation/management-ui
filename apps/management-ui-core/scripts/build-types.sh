#!/bin/bash
# Type check script for build that excludes errors from packages/ui/src/components/ui (auto-generated shadcn/ui files)

# Run tsc -b and capture output
OUTPUT=$(tsc -b 2>&1)
EXIT_CODE=$?

# Filter out errors from packages/ui/src/components/ui
FILTERED_OUTPUT=$(echo "$OUTPUT" | grep -v 'packages/ui/src/components/ui')

# Check if there are any errors remaining (excluding packages/ui/src/components/ui)
if echo "$FILTERED_OUTPUT" | grep -q 'error TS'; then
  echo "$FILTERED_OUTPUT"
  exit 1
fi

# If no errors (or only packages/ui/src/components/ui errors), exit with success
exit 0
