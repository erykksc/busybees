import { GroupCalendar } from "./groupCalendar";
import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

export async function getGroupCalendar(
  client: DynamoDBDocumentClient,
  groupId: string,
  options?: { consistentRead?: boolean },
): Promise<GroupCalendar> {
  const { consistentRead = false } = options ?? {};

  const result = await client.send(
    new GetCommand({
      TableName: Resource.GroupCalendarsTable.name,
      Key: { groupId: groupId },
      ConsistentRead: consistentRead,
    }),
  );

  if (!result.Item) {
    throw new Error("Group calendar not found");
  }

  return result.Item as GroupCalendar;
}

export async function getGroupCalendarByInviteCode(
  client: DynamoDBDocumentClient,
  inviteCode: string,
): Promise<GroupCalendar> {
  const result = await client.send(
    new QueryCommand({
      TableName: Resource.GroupCalendarsTable.name,
      IndexName: "inviteCodeIndex",
      KeyConditionExpression: "inviteCode = :inviteCode",
      ExpressionAttributeValues: {
        ":inviteCode": inviteCode,
      },
    }),
  );

  if (!result.Items || result.Items.length === 0) {
    throw new Error("Group calendar not found");
  }

  return result.Items[0] as GroupCalendar;
}
