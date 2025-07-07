import { Auth } from "googleapis";

export interface UserProfile {
  authSub: string; // Cognito sub - partition key
  [key: `google-${string}`]: Auth.Credentials; // Google auth credentials for Google Calendar API
  [key: `microsoft-${string}`]: any; // Microsoft auth credentials for Outlook API
  [key: `icsfeed-${string}`]: string; // icsfeed-{FEED_NAME}: {url}
  groups?: Set<string>; // Set of User's groups
}
