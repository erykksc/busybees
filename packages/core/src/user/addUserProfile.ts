import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { UserProfile } from "./userProfile";

// TODO: put user profile entry in users table
export async function addUserProfile(
  client: DynamoDBDocumentClient,
  newUserProfileVals: {
    authSub: string;
  },
): Promise<PutCommandOutput> {
  if (newUserProfileVals.authSub.length === 0) {
    throw new Error("authSub is required");
  }

  const result = await client.send(
    new PutCommand({
      TableName: Resource.UserProfilesTable.name,
      Item: newUserProfileVals,
      ConditionExpression: "attribute_not_exists(authSub)",
    }),
  );

  return result;
}
