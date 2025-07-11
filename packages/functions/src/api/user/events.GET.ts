import { Logger } from "@aws-lambda-powertools/logger";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CalendarEventDto,
  getFreeBusyUser,
  getUserProfile,
} from "@busybees/core";
import { v4 as uuidv4 } from "uuid";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

// TODO: this function is mostly a copy of /api/user/freebusy route,
// extract common functionality into core as it is part of the domain

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

    const calendars = await getFreeBusyUser({
      userProfile,
      timeMin,
      timeMax,
      logger,
    });
    logger.info("All calendars busy times fetched", {
      calendars: calendars,
    });

    // Get userId from JWT claims (preferred_username with fallback to username)
    const userId =
      (event.requestContext.authorizer.jwt.claims
        .preferred_username as string) ||
      (event.requestContext.authorizer.jwt.claims.username as string) ||
      authSub;

    // Transform busy times to CalendarEventDto array
    const events: CalendarEventDto[] = [];
    Object.entries(calendars).forEach(([calendarGid, calendarData]) => {
      calendarData.busy.forEach((busyTime) => {
        events.push({
          id: `${calendarGid}-${uuidv4()}`,
          title: "Busy",
          start: busyTime.start,
          end: busyTime.end,
          userId: userId,
          allDay: false,
        });
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ events }),
    };
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
