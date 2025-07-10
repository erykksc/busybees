import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UserProfile, addUserProfile } from "@busybees/core";
import {
  APIGatewayProxyResultV2,
  PostConfirmationTriggerEvent,
} from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  try {
    logger.info("Post confirmation event received", { event });
    const authSub = event.request.userAttributes.sub;
    if (!authSub) {
      logger.error("No authSub found in event", { event });
      return event;
    }

    const newUserProfile: UserProfile = {
      authSub: authSub,
      groups: new Set(),
    };

    const result = await addUserProfile(docClient, newUserProfile);
    logger.info("User profile added", { result });

    return event;
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return event;
  }
};
