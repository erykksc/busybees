import { UserProfile } from "./userProfile";
import { Resource } from "sst";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// This function retrieves a user profile from the DynamoDB UserProfiles table
// return null if the user profile does not exist
export async function getUserProfile(
  client: DynamoDBDocumentClient,
  args: {
    authSub: string;
    consistentRead?: boolean;
  },
): Promise<UserProfile | null> {
  const { authSub, consistentRead = false } = args;

  const result = await client.send(
    new GetCommand({
      TableName: Resource.UserProfilesTable.name,
      Key: { authSub },
      ConsistentRead: consistentRead,
    }),
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as UserProfile;
}
