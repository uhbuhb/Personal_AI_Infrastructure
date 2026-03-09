Run the Rippling time clock CLI based on: $ARGUMENTS

CLI location: `~/personal-repos/rippling_cli/rippling_cli.py`

| Argument | Command |
|----------|---------|
| status (or empty) | `status` |
| in | `clockin` |
| out | `clockout` |
| break | `break` - start break (manual end) |
| break [mins] | `break [mins]` - timed break, auto-ends |
| back | `endbreak` |

Examples:
- `/rippling` or `/rippling status` - check status
- `/rippling in` - clock in
- `/rippling out` - clock out now
- `/rippling break` - start break (manual end)
- `/rippling break 5` - start 5-minute break (auto-ends)
- `/rippling back` - end break

Run: `cd ~/personal-repos/rippling_cli && uv run python rippling_cli.py <command>`

Show the result. If auth error, tell user to refresh Bearer token from browser DevTools.
