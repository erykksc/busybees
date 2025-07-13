import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  UserService,
  GroupCalendarService,
  GroupCalendarDto,
} from "@busybees/core";
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
    if (!authSub || typeof authSub !== "string") {
      return {
        statusCode: 401,
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({ error: "User not authenticated" }),
      };
    }

    const groupId = JSON.parse(event.body || "")?.groupId;
    if (!groupId || typeof groupId !== "string") {
      return {
        statusCode: 400,
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          error: "Invalid groupId in body, must be a string",
        }),
      };
    }

    try {
      const { result, groupCalendar } = await groupService.addGroupCalendar({
        groupId,
        ownerAuthSub: authSub,
      });
      const groupCalendarDto: GroupCalendarDto = {
        groupId: groupCalendar.groupId,
        owner: groupCalendar.owner,
        inviteUrl: "http://localhost:5173/" + groupCalendar.inviteCode,
        members: Array.from(groupCalendar.members),
      };

      return {
        statusCode: 200,
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          message: `Group calendar ${groupId} added successfully`,
          groupCalendar: groupCalendarDto,
        }),
      };
    } catch (error) {
      logger.error("Error adding group calendar", { error });
      return {
        statusCode: 500,
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          error:
            "Failed to add group calendar, likely the name/groupId of the group is already taken",
        }),
      };
    }
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return {
      statusCode: 500,
      headers: {
        ContentType: "application/json",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
