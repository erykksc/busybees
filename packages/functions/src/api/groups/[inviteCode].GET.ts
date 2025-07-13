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
    const inviteCode = event.pathParameters?.inviteCode;
    const userAuthSub = event.requestContext.authorizer.jwt.claims
      .sub as string;

    if (!inviteCode || typeof inviteCode !== "string") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid inviteCode in path parameters, must be a string",
        }),
      };
    }

    logger.info("Received request to join group", { inviteCode, userAuthSub });

    // Find the group by invite code
    const groupCalendar =
      await groupService.getGroupCalendarByInviteCode(inviteCode);

    if (groupCalendar === null) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Group calendar not found" }),
      };
    }

    // Check if user is already a member
    if (groupCalendar.members.has(userAuthSub)) {
      return {
        statusCode: 302,
        headers: {
          Location: `/calendar/${groupCalendar.groupId}`,
        },
        body: "",
      };
    }

    // Add user to the group
    await groupService.addMemberToGroupCalendar(
      groupCalendar.groupId,
      userAuthSub,
    );

    logger.info("User successfully joined group", {
      groupId: groupCalendar.groupId,
      userAuthSub,
      inviteCode,
    });

    return {
      statusCode: 302,
      headers: {
        Location: `/calendar/${groupCalendar.groupId}`,
      },
      body: "",
    };
  } catch (error) {
    logger.error("Error joining group", { error });

    if (
      error instanceof Error &&
      error.message === "Group calendar not found"
    ) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Invalid invite code" }),
      };
    }

    if (
      error instanceof Error &&
      error.message.includes("Group cannot exceed")
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (
      error instanceof Error &&
      error.message === "User is already a member of this group"
    ) {
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "User is already a member of this group",
        }),
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
