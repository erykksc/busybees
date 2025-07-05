import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { google } from "googleapis";
import { Resource } from "sst";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeOauthState, BbOauthState } from "@busybees/core";
import { parseCookies } from "utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { User, GoogleCalendarConnection } from "@busybees/core";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const logger = new Logger({
  serviceName: "sst-app",
});

export const main = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const code = event.queryStringParameters?.code;
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Authorization code is required (`code` in queryStringParameters)",
        }),
      };
    }

    const scope = event.queryStringParameters?.scope;
    if (!scope) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "`scope` is required in queryStringParameters",
        }),
      };
    }
    const requiredScopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "profile",
    ];
    const receivedScopes = scope.split(" ");
    const missingScopes = requiredScopes.filter(
      (s) => !receivedScopes.includes(s),
    );
    if (missingScopes.length > 0) {
      logger.error("Missing required scopes", {
        required: requiredScopes,
        received: receivedScopes,
        missing: missingScopes,
      });
    }

    const state = event.queryStringParameters?.state;
    if (!state) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "`state` is required in queryStringParameters",
        }),
      };
    }
    const decodedState = decodeOauthState(state);
    if (!decodedState.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Invalid OAuth state: ${decodedState.error}`,
        }),
      };
    }
    const stateData = decodedState.data as BbOauthState;

    const cookies = parseCookies(event?.cookies);
    logger.info("Cookies received", cookies);
    const oauthCsrfToken = cookies["oauth_csrf_token"];
    if (!oauthCsrfToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "`oauth_csrf_token` cookie is required but not found",
        }),
      };
    }

    // validate CSRF token
    if (stateData.csrfToken !== oauthCsrfToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "CSRF token mismatch: the CSRF token in the state does not match the one in the cookie",
        }),
      };
    }

    console.log("Request data validated successfully");

    const oauth2Client = new google.auth.OAuth2({
      clientId: Resource.GoogleClientId.value,
      clientSecret: Resource.GoogleClientSecret.value,
      redirectUri: Resource.GoogleRedirectUri.value,
    });

    // Exchange code for tokens
    logger.info("Exchanging code for tokens with Google OAuth2 client");
    const { tokens } = await oauth2Client.getToken(code);
    logger.info("OAuth tokens received from Google by exchanging the `code`", {
      tokens: Object.keys(tokens),
    });
    if (!tokens.access_token || !tokens.refresh_token) {
      const errorMsg =
        "`access_token` or `refresh_token` not found in the response from Google";
      console.error(errorMsg);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: errorMsg }),
      };
    }

    oauth2Client.setCredentials(tokens);

    // Get user's email from Google
    const people = google.people({ version: "v1", auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: "people/me",
      personFields: "emailAddresses",
    });
    const email = profile.data.emailAddresses?.[0]?.value;
    logger.info("Fetched user email from Google People API", {
      email,
      profile,
    });

    // Get user's primary calendar info
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const calendarNames = calendarList.data.items?.map((item) => item.summary);
    console.log(
      "Fetched calendar names list from Google Calendar API",
      JSON.stringify(calendarNames, null, 2),
    );

    // Get or create user record
    const getUserCommand = new GetCommand({
      TableName: Resource.UsersTable.name,
      Key: { authSub: stateData.authSub },
    });

    const userResult = await docClient.send(getUserCommand);
    let user: User = userResult.Item as User;
    logger.info("Fetched user record from DynamoDB", { user });

    if (!user) {
      // Create new user record
      user = {
        authSub: stateData.authSub,
        googleCalendars: [],
      };
    }

    // Create new Google Calendar connection
    const newConnection: GoogleCalendarConnection = {
      email: email!,
      tokens: tokens,
    };

    // Update or add the calendar connection
    const existingIndex = user.googleCalendars.findIndex(
      (cal) => cal.email === email,
    );

    if (existingIndex >= 0) {
      user.googleCalendars[existingIndex] = newConnection;
    } else {
      user.googleCalendars.push(newConnection);
    }

    // Save updated user record
    const putCommand = new PutCommand({
      TableName: Resource.UsersTable.name,
      Item: user,
    });

    const putOutput = await docClient.send(putCommand);
    logger.info("User record upserted successfully", {
      authSub: stateData.authSub,
      email: email,
    });
    logger.debug("PutCommand output", putOutput);

    // Redirect to calendar page
    return {
      statusCode: 302,
      headers: {
        Location: stateData.redirectTo,
      },
      body: "",
    };
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
