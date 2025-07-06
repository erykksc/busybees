import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const authSub = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!authSub) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "User not authenticated" }),
      };
    }

    return {
      statusCode: 501, // Not implementd
      body: JSON.stringify({
        error: "The requested resource is not implemented yet.",
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
