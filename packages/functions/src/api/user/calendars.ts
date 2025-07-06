import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { User } from "@busybees/core";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId =
      event.requestContext.authorizer?.iam?.cognitoIdentity?.identityId;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "User not authenticated" }),
      };
    }

    const getUserCommand = new GetCommand({
      TableName: Resource.UsersTable.name,
      Key: { userId },
    });

    const userResult = await docClient.send(getUserCommand);
    const user = userResult.Item as User;

    if (!user) {
      return {
        statusCode: 200,
        body: JSON.stringify({ googleCalendars: [] }),
      };
    }

    // Return calendar connections without sensitive tokens
    const safeCalendars = user.googleCalendars.map((cal) => ({
      calendarId: cal.calendarId,
      scope: cal.scope,
      provider: cal.provider,
      expiryDate: cal.expiryDate,
      tokenType: cal.tokenType,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ googleCalendars: safeCalendars }),
    };
  } catch (error) {
    console.error("Error fetching user calendars:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
