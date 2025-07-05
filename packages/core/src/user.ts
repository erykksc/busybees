import { Auth } from "googleapis";

export interface GoogleCalendarConnection {
  email: string;
  tokens: Auth.Credentials; // Google auth credentials
}

export interface MsOutlookCalendarConnection {
  url: string;
}

export interface IcsFeedCalendar {
  url: string;
}

export interface User {
  authSub: string; // Cognito sub - partition key
  // primaryCalendar: string;
  googleCalendars: Array<GoogleCalendarConnection>;
  // outlookCalendars: MsOutlookCalendarConnection[];
  // icsFeedCalendars: IcsFeedCalendar[];
}
