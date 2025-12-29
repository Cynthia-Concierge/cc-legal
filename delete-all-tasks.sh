#!/bin/bash
# Delete all tasks from the email-reminders queue

QUEUE="email-reminders"
LOCATION="us-central1"
PROJECT="cc-legal"

echo "🗑️  Deleting all tasks from queue: $QUEUE"
echo ""

# Get all task names and delete them one by one
TASK_NAMES=$(gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name)" 2>&1)

if [ -z "$TASK_NAMES" ]; then
  echo "No tasks found in queue."
  exit 0
fi

TASK_COUNT=$(echo "$TASK_NAMES" | wc -l | tr -d ' ')
echo "Found $TASK_COUNT tasks to delete..."
echo "This may take a minute..."
echo ""

DELETED=0
FAILED=0

while IFS= read -r task_name; do
  if [ -n "$task_name" ]; then
    # task_name is already the full path from gcloud tasks list
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

