# Fix Issue Log — Progress Checklist

- [ ] Issue/failure fetched and understood
- [ ] Root-cause analysis done (affected files identified)
- [ ] Risk classification done (auto_merge_eligible set)
- [ ] Failing test written (or N/A with reason)
- [ ] Implementation attempt(s) made (≤ MAX_LOOPS)
- [ ] lint PASS
- [ ] build PASS
- [ ] test PASS
- [ ] code-review VERDICT: PASS
- [ ] security-review VERDICT: PASS or N/A
- [ ] Run-log written to run-logs/
- [ ] PR opened (draft if high-risk or loops exhausted; ready if clean)
- [ ] enable_pr_auto_merge called (if auto_merge_eligible)
- [ ] Audit comment posted on PR with per-gate verdicts
