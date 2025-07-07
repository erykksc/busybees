import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  DeleteCommandOutput,
} from "@aws-sdk/lib-dynamodb";

export async function removeUser(
  client: DynamoDBDocumentClient,
  authSub: string,
): Promise<DeleteCommandOutput> {
  if (!authSub || authSub.length === 0) {
    throw new Error("authSub is required");
  }

  const result = await client.send(
    new DeleteCommand({
      TableName: Resource.UserProfilesTable.name,
      Key: { authSub },
    }),
  );

  return result;
}
