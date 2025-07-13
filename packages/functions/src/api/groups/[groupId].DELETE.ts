import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UserService, GroupCalendarService, createCacheService } from "@busybees/core";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

const cacheService = createCacheService(logger);

const userService = new UserService({
  logger,
  dbClient,
  cacheService,
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
    const groupId = event.pathParameters?.groupId;
    const requestorAuthSub = event.requestContext.authorizer.jwt.claims
      .sub as string;

    if (!groupId || typeof groupId !== "string") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid groupId in path parameters, must be a string",
        }),
      };
    }

    // Get the group to check if requestor is the owner
    const groupCalendar = await groupService.getGroupCalendar({
      groupId,
      consistentRead: true,
    });

    if (!groupCalendar) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Group not found",
        }),
      };
    }

    // Only the group owner can delete the group
    if (groupCalendar.owner !== requestorAuthSub) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Only the group owner can delete the group",
        }),
      };
    }

    // Remove the group and update all members' profiles
    const result = await groupService.removeGroupCalendar(groupId);

    if (!result) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Group not found",
        }),
      };
    }

    logger.info("Group successfully deleted", {
      groupId,
      deletedBy: requestorAuthSub,
      memberCount: groupCalendar.members.size,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Group deleted successfully",
        groupId,
      }),
    };
  } catch (error) {
    logger.error("Error deleting group", { error });

    if (
      error instanceof Error &&
      error.message === "Group calendar not found"
    ) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Group not found" }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
