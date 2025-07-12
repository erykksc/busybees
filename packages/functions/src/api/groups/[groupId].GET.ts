import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getGroupCalendar } from "@busybees/core";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
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

    const groupCalendar = await getGroupCalendar(dbClient, {
      groupId,
    });
    if (!groupCalendar) {
      return {
        statusCode: 404, // Not Found
        headers: {
          ContentType: "application/json",
        },
        body: JSON.stringify({
          error: "Group calendar not found",
        }),
      };
    }

    return {
      statusCode: 200, // OK
      headers: {
        ContentType: "application/json",
      },
      body: JSON.stringify({
        groupProfile: groupCalendar,
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
