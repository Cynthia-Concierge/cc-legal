# Simple Command to Delete All Tasks

Run this one-liner in your terminal:

```bash
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format=json | python3 -c "import sys, json; [__import__('subprocess').run(['gcloud', 'tasks', 'delete', t['name'], '--quiet'], check=False) for t in json.load(sys.stdin)]"
```

Or use the script (which shows progress):

```bash
./delete-tasks-working.sh
```

After deleting, re-schedule with correct URLs:

```bash
node schedule-nurture-sequence-for-contacts.js
```

