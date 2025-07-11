import { Auth, google } from "googleapis";
import { Logger } from "@aws-lambda-powertools/logger";
import { Resource } from "sst";
import { CalendarFreeBusyDto } from "../freebusy";
import { UserProfile } from "./userProfile";

export type FreeBusyCalendars = Record<string, CalendarFreeBusyDto>;

export async function getFreeBusyUser(args: {
  logger?: Logger;
  userProfile: UserProfile;
  timeMin: string; // ISO 8601 format
  timeMax: string; // ISO 8601 format
}): Promise<FreeBusyCalendars> {
  const { userProfile, logger, timeMin, timeMax } = args;

  const oauth2Client = new google.auth.OAuth2({
    clientId: Resource.GoogleClientId.value,
    clientSecret: Resource.GoogleClientSecret.value,
    redirectUri: Resource.GoogleRedirectUri.value,
  });

  const calendars: FreeBusyCalendars = {};
  for (const key in userProfile) {
    if (key.startsWith("google-")) {
      const creds = userProfile[key as keyof UserProfile] as Auth.Credentials;
      oauth2Client.setCredentials(creds);

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const calendarList = await calendar.calendarList.list({
        showHidden: false,
        showDeleted: false,
        minAccessRole: "reader", // Only fetch calendars with reader access
        maxResults: 250, // Limit to max limit
      });
      logger?.info("Fetched calendar list", { calendarList });

      const calendarFreeBusy = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          groupExpansionMax: 100,
          calendarExpansionMax: 50,
          items: calendarList.data.items?.map((item) => ({
            id: item.id,
          })),
        },
      });

      logger?.debug("Fetched calendar freebusy for all calendars", {
        timeMin,
        timeMax,
        calendarEvents: calendarFreeBusy,
      });

      Object.entries(calendarFreeBusy.data?.calendars || {}).forEach(
        ([calendarId, calendar]) => {
          const calendarGid = `google-${calendarId}`;

          logger?.info("Processing calendar", { calendarId, calendar });
          // Create new events for the calendar
          if (calendars[calendarGid] === undefined) {
            calendars[calendarGid] = { busy: [] };
          }

          // Validate busy times
          calendar.busy?.forEach((busy) => {
            if (!busy.start || !busy.end) {
              logger?.warn("Invalid busy event format", { calendarId, busy });
              return;
            }
            calendars[calendarGid].busy.push({
              start: busy.start,
              end: busy.end,
            });
          });
        },
      );
    }
  }
  return calendars;
}
