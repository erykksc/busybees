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

interface RemoveMemberRequestBody {
  memberAuthSub: string;
}

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

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Request body is required",
        }),
      };
    }

    let requestBody: RemoveMemberRequestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid JSON in request body",
        }),
      };
    }

    if (
      !requestBody.memberAuthSub ||
      typeof requestBody.memberAuthSub !== "string"
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "memberAuthSub is required and must be a string",
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

    // Only the group owner can remove members
    if (groupCalendar.owner !== requestorAuthSub) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Only the group owner can remove members",
        }),
      };
    }

    // Check if the member is actually in the group
    if (!groupCalendar.members.has(requestBody.memberAuthSub)) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "User is not a member of this group",
        }),
      };
    }

    // Remove the member from the group
    const result = await groupService.removeMemberFromGroupCalendar({
      groupId,
      memberAuthSub: requestBody.memberAuthSub,
    });

    if (!result) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "User is not a member of this group",
        }),
      };
    }

    logger.info("Member successfully removed from group", {
      groupId,
      memberAuthSub: requestBody.memberAuthSub,
      removedBy: requestorAuthSub,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Member removed successfully",
        groupId,
        removedMember: requestBody.memberAuthSub,
      }),
    };
  } catch (error) {
    logger.error("Error removing member from group", { error });

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

    if (
      error instanceof Error &&
      error.message === "Cannot remove the group owner"
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Cannot remove the group owner" }),
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
