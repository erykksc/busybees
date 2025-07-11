import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { GroupCalendar } from "./groupCalendar";
import { v4 as uuidv4 } from "uuid";

export async function addGroupCalendar(
  client: DynamoDBDocumentClient,
  args: { groupId: string; ownerAuthSub: string },
): Promise<{
  result: TransactWriteCommandOutput;
  groupCalendar: GroupCalendar;
}> {
  const { groupId, ownerAuthSub } = args;

  const groupCalendar: GroupCalendar = {
    groupId: groupId,
    owner: ownerAuthSub,
    inviteCode: uuidv4(),
    members: new Set([ownerAuthSub]),
  };

  if (groupCalendar.groupId.length === 0) {
    throw new Error("groupId is required");
  }

  if (groupCalendar.owner.length === 0) {
    throw new Error("owner is required");
  }

  if (groupCalendar.inviteCode.length === 0) {
    throw new Error("inviteCode is required");
  }

  if (!(groupCalendar.members instanceof Set)) {
    throw new Error(
      "members must be a set, passed as: " + groupCalendar.members,
    );
  }

  if (!groupCalendar.members) {
    throw new Error("members is required with owner's authSub");
  }

  if (!groupCalendar.members.has(groupCalendar.owner)) {
    throw new Error("owner must be in members list");
  }

  // It should only be the owner in the members list during creation
  if (groupCalendar.members.size > 1) {
    throw new Error(
      "members list should only contain the owner during creation",
    );
  }

  const result = await client.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: Resource.GroupCalendarsTable.name,
            Item: groupCalendar,
            ConditionExpression: "attribute_not_exists(groupId)",
          },
        },
        {
          Update: {
            TableName: Resource.UserProfilesTable.name,
            Key: { authSub: groupCalendar.owner },
            UpdateExpression: "ADD #members :groupId",
            ExpressionAttributeNames: { "#members": "members" },
            ExpressionAttributeValues: {
              ":groupId": new Set([groupCalendar.groupId]),
            },
            ConditionExpression: "attribute_exists(authSub)",
          },
        },
      ],
    }),
  );

  return { result, groupCalendar };
}
