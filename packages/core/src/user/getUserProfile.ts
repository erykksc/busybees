import { UserProfile } from "./userProfile";
import { Resource } from "sst";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// TODO: retrieve user profile from the users table
export async function getUserProfile(
  client: DynamoDBDocumentClient,
  authSub: string,
  options?: { consistentRead?: boolean },
): Promise<UserProfile> {
  const { consistentRead = false } = options ?? {};

  const result = await client.send(
    new GetCommand({
      TableName: Resource.UserProfilesTable.name,
      Key: { authSub },
      ConsistentRead: consistentRead,
    }),
  );

  if (!result.Item) {
    throw new Error("User profile not found");
  }

  return result.Item as UserProfile;
}
