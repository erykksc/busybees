import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { getGroupCalendar } from "./getGroupCalendar";

export async function removeGroupCalendar(
  client: DynamoDBDocumentClient,
  groupId: string,
): Promise<TransactWriteCommandOutput> {
  if (!groupId || groupId.length === 0) {
    throw new Error("groupId is required");
  }

  // First get the group to know which users to update (use consistent read)
  const groupCalendar = await getGroupCalendar(client, groupId, {
    consistentRead: true,
  });

  const groupMembers = groupCalendar.members.values();

  // Create transaction items to remove group from all members' profiles
  const transactItems = [
    // Delete the group calendar
    {
      Delete: {
        TableName: Resource.GroupCalendarsTable.name,
        Key: { groupId: groupId },
      },
    },
    // Remove groupId from each member's groups array
    ...groupMembers.map((authSub) => ({
      Update: {
        TableName: Resource.UserProfilesTable.name,
        Key: { authSub },
        UpdateExpression: "DELETE groups :groupSet",
        ExpressionAttributeValues: {
          ":groupSet": new Set([groupId]),
        },
      },
    })),
  ];

  const result = await client.send(
    new TransactWriteCommand({
      TransactItems: transactItems,
    }),
  );

  return result;
}

