#!/bin/bash
mkdir -p run-logs
echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"event\":\"${CLAUDE_HOOK_EVENT}\",\"tool\":\"${CLAUDE_TOOL_NAME}\",\"session\":\"${CLAUDE_SESSION_ID}\",\"cwd\":\"${CLAUDE_WORKING_DIR}\"}" \
  >> run-logs/session-audit.jsonl
exit 0
