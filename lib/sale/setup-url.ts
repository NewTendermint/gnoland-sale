// Echo's hosted entity-setup page for a sale - the only place a user can start or finish
// KYC/entity setup (there is no SDK API for it). The sale UUID is public: it is in the URL of
// every user who completes setup on Echo.
export function sonarSetupUrl(saleUUID: string | undefined): string {
  return saleUUID ? `https://app.echo.xyz/sonar/${saleUUID}` : "https://app.echo.xyz"
}
