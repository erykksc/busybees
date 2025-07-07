import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UserProfile } from "@busybees/core";
import { addUserProfile } from "@busybees/core/user/addUserProfile";
import {
  APIGatewayProxyResultV2,
  PostConfirmationTriggerEvent,
} from "aws-lambda";
import { Resource } from "sst";

const client = new DynamoDBClient({
  region: Resource.AwsRegion.value,
});
const docClient = DynamoDBDocumentClient.from(client);
const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: PostConfirmationTriggerEvent,
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info("Post confirmation event received", { event });
    const authSub = event.request.userAttributes.sub;
    if (!authSub) {
      logger.error("No authSub found in event", { event });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "User attributes do not contain 'sub'",
        }),
      };
    }

    const newUserProfile: UserProfile = {
      authSub: event.request.userAttributes.sub,
      groups: new Set(),
    };

    const result = await addUserProfile(docClient, newUserProfile);
    logger.info("User profile added", { result });

    return {
      statusCode: 200, // Not implementd
      body: "",
    };
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
