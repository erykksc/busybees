import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { UserProfile } from "./userProfile";

export async function addUserProfile(
  client: DynamoDBDocumentClient,
  newUserProfileVals: {
    authSub: string;
    username?: string;
  },
): Promise<PutCommandOutput> {
  const { authSub, username } = newUserProfileVals;
  if (authSub.length === 0) {
    throw new Error("authSub is required");
  }

  const userProfile = new UserProfile({
    authSub,
    username: username ?? authSub, // default to authSub if username is not provided
  });

  const result = await client.send(
    new PutCommand({
      TableName: Resource.UserProfilesTable.name,
      Item: userProfile,
      ConditionExpression: "attribute_not_exists(authSub)",
    }),
  );

  return result;
}
