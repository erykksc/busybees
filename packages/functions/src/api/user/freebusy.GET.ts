import { Logger } from "@aws-lambda-powertools/logger";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getUserProfile, UserProfile } from "@busybees/core";
import { google, Auth } from "googleapis";
import { Resource } from "sst";
import { CalendarFreeBusyDto } from "@busybees/core";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const authSub = event.requestContext.authorizer.jwt.claims.sub;
    if (!authSub) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "User not authenticated" }),
      };
    }
    if (typeof authSub !== "string") {
      logger.error("authSub is not a valid string", { authSub });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid authSub, must be string" }),
      };
    }

    const timeMin = event.queryStringParameters?.timeMin;
    const timeMax = event.queryStringParameters?.timeMax;
    if (!timeMin || !timeMax) {
      logger.error("Missing timeMin or timeMax in query parameters", {
        queryStringParameters: event.queryStringParameters,
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "timeMin and timeMax are required in query parameters",
        }),
      };
    }

    const userProfile = await getUserProfile(dbClient, {
      authSub: authSub,
    });
    logger.info("User profile retrieved", { userProfile });

    // Check if userProfile found
    if (!userProfile) {
      return {
        statusCode: 404, // Not found
        body: JSON.stringify({
          error: "User profile not found",
        }),
      };
    }

    const oauth2Client = new google.auth.OAuth2({
      clientId: Resource.GoogleClientId.value,
      clientSecret: Resource.GoogleClientSecret.value,
      redirectUri: Resource.GoogleRedirectUri.value,
    });

    const calendars: Record<string, CalendarFreeBusyDto> = {};
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
        logger.info("Fetched calendar list", { calendarList });

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

        logger.debug("Fetched calendar freebusy for all calendars", {
          timeMin,
          timeMax,
          calendarEvents: calendarFreeBusy,
        });

        Object.entries(calendarFreeBusy.data?.calendars || {}).forEach(
          ([calendarId, calendar]) => {
            const calendarGid = `google-${calendarId}`;

            logger.info("Processing calendar", { calendarId, calendar });
            // Create new events for the calendar
            if (calendars[calendarGid] === undefined) {
              calendars[calendarGid] = { busy: [] };
            }

            // Validate busy times
            calendar.busy?.forEach((busy) => {
              if (!busy.start || !busy.end) {
                logger.warn("Invalid busy event format", { calendarId, busy });
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
    logger.info("All calendars busy times fetched", {
      calendars: calendars,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Calendar events fetched successfully",
        calendars,
      }),
    };
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
