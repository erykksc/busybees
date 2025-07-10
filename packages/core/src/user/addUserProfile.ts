import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";

// TODO: put user profile entry in users table
export async function addUserProfile(
  client: DynamoDBDocumentClient,
  newUserProfileVals: {
    authSub: string;
  },
): Promise<PutCommandOutput> {
  const { authSub } = newUserProfileVals;
  if (authSub.length === 0) {
    throw new Error("authSub is required");
  }

  const result = await client.send(
    new PutCommand({
      TableName: Resource.UserProfilesTable.name,
      Item: {
        authSub,
      },
      ConditionExpression: "attribute_not_exists(authSub)",
    }),
  );

  return result;
}
