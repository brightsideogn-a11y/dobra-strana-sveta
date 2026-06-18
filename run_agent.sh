#!/bin/bash
# Bright Side - Good News Agent Launcher

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

# Check if .env file exists OR if GEMINI_API_KEY is already exported in the shell environment
if [ ! -f .env ] && [ -z "$GEMINI_API_KEY" ]; then
  echo "============================================================"
  echo "Error: .env file not found and GEMINI_API_KEY is not set!"
  echo "Please create a '.env' file in this folder and add:"
  echo "GEMINI_API_KEY=your_key_here"
  echo "------------------------------------------------------------"
  echo "To get a free key, visit: https://aistudio.google.com/app/api-keys"
  echo "============================================================"
  exit 1
fi

echo "[$(date)] Launching Bright Side AI Agent..."
python3 good_news_agent.py
echo "[$(date)] Agent finished."
