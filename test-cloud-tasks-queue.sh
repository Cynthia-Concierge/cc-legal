#!/bin/bash
# Script to test and monitor Cloud Tasks queue for nurture sequence emails

echo "📊 Cloud Tasks Queue Status"
echo "============================"
echo ""

# Get total task count
TOTAL=$(gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
echo "Total tasks in queue: $TOTAL"
echo ""

# Count by scheduled date
echo "Tasks by scheduled date:"
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(scheduleTime)" 2>/dev/null | cut -d'T' -f1 | sort | uniq -c | sort -rn
echo ""

# Count by email type (from URL)
echo "Tasks by email type:"
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(httpRequest.url)" 2>/dev/null | grep -oE "(case-study|risk-scenario|social-proof|final-reminder)" | sort | uniq -c
echo ""

# Show next 5 tasks to execute
echo "Next 5 tasks to execute:"
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="table(scheduleTime,httpRequest.url)" --sort-by=scheduleTime --limit=5 2>/dev/null
echo ""

# Show tasks scheduled for today
TODAY=$(date -u +%Y-%m-%d)
echo "Tasks scheduled for today ($TODAY):"
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="table(scheduleTime,httpRequest.url)" --filter="scheduleTime:$TODAY" 2>/dev/null | head -10
echo ""

# Show tasks scheduled for tomorrow
TOMORROW=$(date -u -v+1d +%Y-%m-%d 2>/dev/null || date -u -d "+1 day" +%Y-%m-%d 2>/dev/null || date -u +%Y-%m-%d)
echo "Tasks scheduled for tomorrow ($TOMORROW):"
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="table(scheduleTime,httpRequest.url)" --filter="scheduleTime:$TOMORROW" 2>/dev/null | head -10

