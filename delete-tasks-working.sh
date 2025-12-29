#!/bin/bash
# Working script to delete all Cloud Tasks

QUEUE="email-reminders"
LOCATION="us-central1"
PROJECT="cc-legal"

echo "🗑️  Deleting all tasks from queue: $QUEUE"
echo ""

# Get all tasks as JSON and extract full paths
TASK_NAMES=$(gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format=json | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
for task in tasks:
    print(task['name'])
")

if [ -z "$TASK_NAMES" ]; then
  echo "No tasks found."
  exit 0
fi

TASK_COUNT=$(echo "$TASK_NAMES" | wc -l | tr -d ' ')
echo "Found $TASK_COUNT tasks. Deleting..."
echo ""

DELETED=0
FAILED=0

while IFS= read -r task_name; do
  if [ -n "$task_name" ]; then
    if gcloud tasks delete "$task_name" --quiet 2>&1 > /dev/null; then
      DELETED=$((DELETED + 1))
      if [ $((DELETED % 50)) -eq 0 ]; then
        echo "Deleted $DELETED/$TASK_COUNT tasks..."
      fi
    else
      FAILED=$((FAILED + 1))
    fi
  fi
done <<< "$TASK_NAMES"

echo ""
echo "✅ Deleted: $DELETED tasks"
if [ $FAILED -gt 0 ]; then
  echo "❌ Failed: $FAILED tasks"
fi

