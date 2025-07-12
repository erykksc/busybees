import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getUserProfile } from "@busybees/core";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const authSub = event.requestContext.authorizer.jwt.claims.sub;
    if (typeof authSub !== "string" || !authSub) {
      throw new Error("authSub is not a valid string");
    }

    const userProfile = await getUserProfile(client, {
      authSub,
    });
    logger.info("User profile retrieved", { userProfile });

    // check if userProfile found
    if (!userProfile) {
      return {
        statusCode: 404, // Not found
        body: JSON.stringify({
          error: "User profile not found",
        }),
      };
    }

    const userProfileDto = userProfile.toDto();
    logger.info("UserProfileDto created", { userProfileDto });

    return {
      statusCode: 200, // OK
      body: JSON.stringify({
        userProfile: userProfileDto,
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
