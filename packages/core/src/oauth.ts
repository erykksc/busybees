export type BbOauthState = {
  redirectTo: string; // URL to redirect after OAuth flow
  csrfToken: string; // CSRF token for security
  authSub: string; // User's account ID
};

export function encodeOauthState(state: BbOauthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64");
}

export function decodeOauthState(encodedState: string): {
  success: boolean;
  data?: BbOauthState;
  error?: string;
} {
  // validate the data structure
  const data = JSON.parse(Buffer.from(encodedState, "base64").toString());
  if (
    typeof data.redirectTo !== "string" ||
    typeof data.csrfToken !== "string" ||
    typeof data.authSub !== "string"
  ) {
    return {
      success: false,
      error: "Invalid OAuth state structure",
    };
  }
  return { success: true, data: data as BbOauthState };
}
