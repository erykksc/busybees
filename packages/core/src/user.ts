export interface GoogleCalendarConnection {
  calendarId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // timestamp in milliseconds
  scope: string;
  tokenType: string;
  provider: "google";
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
  googleCalendars: GoogleCalendarConnection[];
  outlookCalendars: MsOutlookCalendarConnection[];
  icsFeedCalendars: IcsFeedCalendar[];
}
