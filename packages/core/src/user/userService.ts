import { Resource } from "sst";
import { Auth, google } from "googleapis";
import {
  DeleteCommand,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  PutCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { UserProfile } from "./userProfile";
import { Logger } from "@aws-lambda-powertools/logger";
import { CalendarFreeBusyDto } from "../freebusy";

export type FreeBusyCalendars = Record<string, CalendarFreeBusyDto>;

export class UserService {
  private logger?: Logger;
  private dbClient: DynamoDBDocumentClient;

  constructor(args: { logger?: Logger; dbClient: DynamoDBDocumentClient }) {
    this.logger = args.logger;
    this.dbClient = args.dbClient;
  }

  async getUserProfile(args: {
    authSub: string;
    consistentRead?: boolean;
  }): Promise<UserProfile | null> {
    this.logger?.info("Received request: getUserProfile", { args });
    const { authSub, consistentRead = false } = args;

    const result = await this.dbClient.send(
      new GetCommand({
        TableName: Resource.UserProfilesTable.name,
        Key: { authSub },
        ConsistentRead: consistentRead,
      }),
    );

    if (!result.Item) {
      return null;
    }

    return UserProfile.fromRecord(result.Item);
  }

  async addUserProfile(args: {
    authSub: string;
    username: string;
  }): Promise<PutCommandOutput> {
    this.logger?.info("Received request: addUserProfile", { args });
    const { authSub, username } = args;
    if (authSub.length === 0) {
      throw new Error("authSub is required");
    }

    const userProfile = new UserProfile({
      authSub,
      username: username,
    });

    const result = await this.dbClient.send(
      new PutCommand({
        TableName: Resource.UserProfilesTable.name,
        Item: userProfile,
        ConditionExpression: "attribute_not_exists(authSub)",
      }),
    );

    return result;
  }

  async removeUserProfile(args: {
    authSub: string;
  }): Promise<DeleteCommandOutput> {
    this.logger?.info("Received request: removeUserProfile", { args });
    const { authSub } = args;
    if (!authSub || authSub.length === 0) {
      throw new Error("authSub is required");
    }

    const result = await this.dbClient.send(
      new DeleteCommand({
        TableName: Resource.UserProfilesTable.name,
        Key: { authSub },
      }),
    );

    return result;
  }

  async upsertGoogleCreds2UserProfile(args: {
    authSub: string;
    primaryEmail: string;
    creds: Auth.Credentials;
  }): Promise<UpdateCommandOutput> {
    const { authSub, primaryEmail, creds } = args;
    if (!authSub || authSub.length === 0) {
      throw new Error("authSub is required");
    }

    const field: keyof UserProfile = `google-${primaryEmail}`;

    const result = await this.dbClient.send(
      new UpdateCommand({
        TableName: Resource.UserProfilesTable.name,
        Key: { authSub },
        UpdateExpression: `SET #field = :value`,
        ExpressionAttributeNames: {
          "#field": field,
        },
        ExpressionAttributeValues: {
          ":value": creds,
        },
      }),
    );
    this.logger?.info("Google calendar tokens upserted", {
      authSub,
    });

    return result;
  }

  async getFreeBusyFromAllCalendars(args: {
    userProfile: UserProfile;
    timeMin: string; // ISO 8601 format
    timeMax: string; // ISO 8601 format
  }): Promise<FreeBusyCalendars> {
    const { userProfile, timeMin, timeMax } = args;

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
        this.logger?.info("Fetched calendar list", { calendarList });

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

        this.logger?.debug(
          "Fetched freebusy status for all calendars in google account",
          {
            timeMin,
            timeMax,
            calendarEvents: calendarFreeBusy,
            googleAccount: key,
          },
        );

        Object.entries(calendarFreeBusy.data?.calendars || {}).forEach(
          ([calendarId, calendar]) => {
            const calendarGid = `google-${calendarId}`;

            this.logger?.info("Processing calendar", { calendarId, calendar });
            // Create new events for the calendar
            if (calendars[calendarGid] === undefined) {
              calendars[calendarGid] = { busy: [] };
            }

            // Validate busy times
            calendar.busy?.forEach((busy) => {
              if (!busy.start || !busy.end) {
                this.logger?.warn("Invalid busy event format", {
                  calendarId,
                  busy,
                });
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
}
