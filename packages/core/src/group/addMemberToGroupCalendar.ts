import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";

export async function addMemberToGroupCalendar(
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

  const result = await client.send(
    new TransactWriteCommand({
      TransactItems: [
        // Add member to group's members array
        {
          Update: {
            TableName: Resource.GroupCalendarsTable.name,
            Key: { groupId: groupId },
            UpdateExpression: "ADD members :memberSet",
            ExpressionAttributeValues: {
              ":memberSet": new Set([memberAuthSub]),
            },
            ConditionExpression: "attribute_exists(groupId)",
          },
        },
        // Add groupId to user's groups array
        {
          Update: {
            TableName: Resource.UserProfilesTable.name,
            Key: { authSub: memberAuthSub },
            UpdateExpression: "ADD groups :groupSet",
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
