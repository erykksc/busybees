import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { Auth } from "googleapis";
import { UserProfile } from "./userProfile";
import { Logger } from "@aws-lambda-powertools/logger";

export async function upsertGoogleCalendarInUserProfile(
  client: DynamoDBDocumentClient,
  args: {
    authSub: string;
    primaryEmail: string;
    creds: Auth.Credentials;
    logger?: Logger;
  },
): Promise<UpdateCommandOutput> {
  const { authSub, primaryEmail, creds, logger } = args;
  if (!authSub || authSub.length === 0) {
    throw new Error("authSub is required");
  }

  const field: keyof UserProfile = `google-${primaryEmail}`;

  const result = await client.send(
    new UpdateCommand({
      TableName: Resource.UserProfilesTable.name,
      Key: { authSub },
      UpdateExpression: `SET #field = :value`,
      ExpressionAttributeNames: {
        "#field": field,
      },
      ExpressionAttributeValues: {
        ":value": creds,
      },
    }),
  );
  logger?.info("Google calendar tokens upserted", {
    authSub,
  });

  return result;
}
