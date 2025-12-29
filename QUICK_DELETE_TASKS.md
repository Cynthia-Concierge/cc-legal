# Quick Way to Delete All Cloud Tasks

You have a few options:

## Option 1: One-liner (Fastest)
```bash
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" | xargs -I {} gcloud tasks delete {} --quiet
```

## Option 2: Python Script (More reliable)
```bash
python3 delete-all-tasks-simple.py
```

## Option 3: Manual batch delete (if others fail)
```bash
# Get task count first
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" | wc -l

# Delete in batches of 100
for task in $(gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" --limit=100); do
  gcloud tasks delete "$task" --quiet
done
```

## After deleting, re-schedule with correct URLs:
```bash
node schedule-nurture-sequence-for-contacts.js
```

This will create new tasks with the correct URLs (no double `/api/api/`).

