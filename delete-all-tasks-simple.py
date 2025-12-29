#!/usr/bin/env python3
"""
Simple script to delete all Cloud Tasks
Run: python3 delete-all-tasks-simple.py
"""

import subprocess
import json
import sys

QUEUE = "email-reminders"
LOCATION = "us-central1"
PROJECT = "cc-legal"

print(f"Fetching all tasks from queue: {QUEUE}...")

# Get all tasks
result = subprocess.run(
    ["gcloud", "tasks", "list", 
     f"--queue={QUEUE}",
     f"--location={LOCATION}",
     f"--project={PROJECT}",
     "--format=json"],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"Error fetching tasks: {result.stderr}")
    sys.exit(1)

tasks = json.loads(result.stdout)
task_count = len(tasks)

if task_count == 0:
    print("No tasks found!")
    sys.exit(0)

print(f"Found {task_count} tasks. Deleting...\n")

deleted = 0
failed = 0

for i, task in enumerate(tasks, 1):
    task_name = task["name"]
    
    # Delete the task
    delete_result = subprocess.run(
        ["gcloud", "tasks", "delete", task_name, "--quiet"],
        capture_output=True,
        text=True
    )
    
    if delete_result.returncode == 0:
        deleted += 1
        if deleted % 50 == 0:
            print(f"Deleted {deleted}/{task_count} tasks...")
    else:
        failed += 1
        if failed <= 5:  # Only show first 5 errors
            print(f"Failed to delete task: {task_name[:50]}...")

print(f"\n✅ Deleted: {deleted} tasks")
if failed > 0:
    print(f"❌ Failed: {failed} tasks")

