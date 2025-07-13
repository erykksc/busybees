import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  CalendarEventDto,
  FreeBusyCalendars,
  UserProfile,
  UserService,
  GroupCalendarService,
} from "@busybees/core";
import { v4 as uuidv4 } from "uuid";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

const userService = new UserService({
  logger,
  dbClient,
});

const groupService = new GroupCalendarService({
  logger,
  dbClient,
  userService,
});

export const main = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const authSub = event.requestContext.authorizer.jwt.claims.sub;
    if (typeof authSub !== "string" || !authSub) {
      throw new Error("authSub is not a valid string");
    }

    const groupId = event.pathParameters?.groupId;

    if (!groupId || typeof groupId !== "string") {
      return {
        statusCode: 400, // Bad Request
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          error: "Invalid groupId in path parameters, must be a string",
        }),
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

    const groupCalendar = await groupService.getGroupCalendar({
      groupId,
    });

    if (!groupCalendar) {
      return {
        statusCode: 404, // Not found
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          error: "Group calendar not found",
        }),
      };
    }

    logger.info("Group calendar retrieved", { groupCalendar });

    let promises: Promise<UserProfile | null>[] = [];
    groupCalendar.members.forEach((member) => {
      promises.push(userService.getUserProfile({ authSub: member }));
    });
    let userProfiles: (UserProfile | null)[] = [];
    try {
      userProfiles = await Promise.all(promises);
    } catch (error) {
      logger.error("Error retrieving user profiles", { error });
    }

    logger.info("User profiles retrieved", { userProfiles });

    // retrieve their freebusy calendars
    let calPromises: Promise<FreeBusyCalendars | null>[] = [];
    userProfiles.forEach((userProfile) => {
      if (userProfile === null) {
        logger.warn("User profile is null, skipping");
        calPromises.push(Promise.resolve(null));
        return;
      }
      calPromises.push(
        userService.getFreeBusyFromAllCalendars({
          userProfile,
          timeMin,
          timeMax,
        }),
      );
    });
    let allUserCalendars: (FreeBusyCalendars | null)[] = [];
    try {
      allUserCalendars = await Promise.all(calPromises);
      logger.info("All calendars busy times fetched", {
        calendars: allUserCalendars,
      });
    } catch (error) {
      logger.error("Error fetching calendars", { error });
      return {
        statusCode: 500, // Internal Server Error
        body: JSON.stringify({ error: "Failed to fetch calendars" }),
      };
    }

    // Transform busy times to CalendarEventDto array
    const events: CalendarEventDto[] = [];
    allUserCalendars.forEach((calendars, idx) => {
      if (calendars === null) {
        // the nulls are needed to retried user profiles based on idx
        return;
      }
      Object.entries(calendars).forEach(([calendarGid, calendarData]) => {
        calendarData.busy.forEach((busyTime) => {
          events.push({
            id: `${calendarGid}-${uuidv4()}`,
            title: "Busy",
            start: busyTime.start,
            end: busyTime.end,
            userId: userProfiles[idx]?.authSub || "unknown-user",
            allDay: false,
          });
        });
      });
    });

    return {
      statusCode: 200, // OK
      headers: {
        ContentType: "application/json",
      },
      body: JSON.stringify({
        events,
      }),
    };
  } catch (error) {
    console.error("Error in OAuth callback", error);
    logger.error("Error in OAuth callback", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
