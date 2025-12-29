#!/bin/bash
# Delete all tasks from the email-reminders queue

QUEUE="email-reminders"
LOCATION="us-central1"
PROJECT="cc-legal"

echo "🗑️  Deleting all tasks from queue: $QUEUE"
echo ""

# Get task count first
TASK_COUNT=$(gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name)" 2>&1 | wc -l | tr -d ' ')

if [ "$TASK_COUNT" -eq 0 ]; then
  echo "No tasks found in queue."
  exit 0
fi

echo "Found $TASK_COUNT tasks to delete..."
echo "This may take a minute..."
echo ""

# Use purge to delete all tasks at once (faster)
gcloud tasks purge --queue=$QUEUE --location=$LOCATION --project=$PROJECT 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully purged all $TASK_COUNT tasks from the queue"
else
  echo ""
  echo "❌ Error purging tasks. Trying individual deletion..."
  
  # Fallback: delete individually
  DELETED=0
  gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name)" 2>&1 | while IFS= read -r task_name; do
    if [ -n "$task_name" ]; then
      gcloud tasks delete "$task_name" --location=$LOCATION --project=$PROJECT --quiet 2>&1 > /dev/null && DELETED=$((DELETED + 1))
      if [ $((DELETED % 50)) -eq 0 ]; then
        echo "Deleted $DELETED tasks..."
      fi
    fi
  done
  echo "✅ Deleted $DELETED tasks"
fi

