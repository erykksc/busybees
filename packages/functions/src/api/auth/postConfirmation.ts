import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UserService } from "@busybees/core";
import { PostConfirmationTriggerEvent } from "aws-lambda";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const logger = new Logger({
  serviceName: "sst-app",
});

const userService = new UserService({
  logger,
  dbClient,
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

    logger.info("Creating new user profile", { authSub });
    const result = await userService.addUserProfile({
      authSub: authSub,
      username: event.request.userAttributes.email || authSub,
    });
    logger.info("User profile added", { result });

    return event;
  } catch (error) {
    logger.error("Error in OAuth callback", { error });
    return event;
  }
};
