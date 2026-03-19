# GDP Mission Control

Starter web dashboard prototype for Grayson Design Partners operations:
- jobs pipeline
- billing queue
- alerts
- utilization and revenue KPIs

## Live Sheet Wiring
This dashboard is wired to Google Sheet:
`1Ym3DmIw7gwF0I6hMk9b1GRxRZzVNVVoHhQvQd4hMhkY`

If you see “Using demo data”, make the sheet readable for web fetches:
- Share → General access: **Anyone with the link (Viewer)**

## Sync Hardening
Queue sync now requires a shared token.
- Set `SHARED_SYNC_TOKEN` in `apps-script.gs`
- Deploy Apps Script web app
- In dashboard, click **Sync Queue** and provide endpoint + token

## Next Iterations
- Add authentication/roles (Jon/Joy)
- Add invoice draft generation workflow
- Add email triage queue automation
- Add real turnaround-time calculation
