import { Auth } from "googleapis";

export interface UserProfile {
  authSub: string; // Cognito sub - partition key
  [key: `google-${string}`]: Auth.Credentials; // Google auth credentials for Google Calendar API
  [key: `microsoft-${string}`]: any; // Microsoft auth credentials for Outlook API
  [key: `icsfeed-${string}`]: string; // icsfeed-{FEED_NAME}: {url}
  groups?: Set<string>; // Set of User's group ids
  // NOTE: allow specifying which calendars are used to show the status busy
  // for now the google api is queried for busy statuses
}

export interface UserProfileDto {
  groupNames: string[]; // List of groups the user belongs to
  googleAccountNames: string[]; // List of Google Account names (primary email addresses)
}
