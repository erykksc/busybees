import { Resource } from "sst";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";

export async function updateGroupCalendar(
  client: DynamoDBDocumentClient,
  groupId: string,
  updates: {
    name?: string;
  },
): Promise<UpdateCommandOutput> {
  if (!groupId || groupId.length === 0) {
    throw new Error("groupId is required");
  }

  if (!updates.name) {
    throw new Error("At least one field must be updated");
  }

  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  if (updates.name) {
    updateExpressions.push("#name = :name");
    expressionAttributeNames["#name"] = "name";
    expressionAttributeValues[":name"] = updates.name;
  }

  const result = await client.send(
    new UpdateCommand({
      TableName: Resource.GroupCalendarsTable.name,
      Key: { groupId: groupId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(groupId)",
      ReturnValues: "ALL_NEW",
    }),
  );

  return result;
}

