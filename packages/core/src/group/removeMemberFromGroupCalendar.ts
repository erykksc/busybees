import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { getGroupCalendar } from "./getGroupCalendar";

export async function removeMemberFromGroupCalendar(
  client: DynamoDBDocumentClient,
  groupId: string,
  memberAuthSub: string,
): Promise<TransactWriteCommandOutput> {
  if (!groupId || groupId.length === 0) {
    throw new Error("groupId is required");
  }

  if (!memberAuthSub || memberAuthSub.length === 0) {
    throw new Error("memberAuthSub is required");
  }

  // Get the group to check if member is the owner
  const groupCalendar = await getGroupCalendar(client, groupId, true);

  if (groupCalendar.owner === memberAuthSub) {
    throw new Error("Cannot remove the group owner");
  }

  const result = await client.send(
    new TransactWriteCommand({
      TransactItems: [
        // Remove member from group's members array
        {
          Update: {
            TableName: Resource.GroupCalendarsTable.name,
            Key: { groupId: groupId },
            UpdateExpression: "DELETE members :memberSet",
            ExpressionAttributeValues: {
              ":memberSet": new Set([memberAuthSub]),
            },
            ConditionExpression: "attribute_exists(groupId)",
          },
        },
        // Remove groupId from user's groups array
        {
          Update: {
            TableName: Resource.UserProfilesTable.name,
            Key: { authSub: memberAuthSub },
            UpdateExpression: "DELETE groups :groupSet",
            ExpressionAttributeValues: {
              ":groupSet": new Set([groupId]),
            },
            ConditionExpression: "attribute_exists(authSub)",
          },
        },
      ],
    }),
  );

  return result;
}
