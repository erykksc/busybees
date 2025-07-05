export interface GoogleCalendarConnection {
  calendarId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // timestamp in milliseconds
  scope: string;
  tokenType: string;
  provider: "google";
}

export interface User {
  userId: string; // Cognito sub - partition key
  email: string;
  googleCalendars: GoogleCalendarConnection[];
}
