import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { google } from "googleapis";
import { Resource } from "sst";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeOauthState, BbOauthState, UserService } from "@busybees/core";
import { parseCookies } from "utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const logger = new Logger({
  serviceName: "sst-app",
});

const userService = new UserService({
  logger,
  dbClient,
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
      const error = {
        required: requiredScopes,
        received: receivedScopes,
        missing: missingScopes,
      };

      logger.error("Missing required scopes", error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error,
        }),
      };
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

    logger.info("Request data validated successfully");

    const oauth2Client = new google.auth.OAuth2({
      clientId: Resource.GoogleClientId.value,
      clientSecret: Resource.GoogleClientSecret.value,
      redirectUri: Resource.GoogleRedirectUri.value,
    });

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    logger.info("OAuth tokens received from Google by exchanging the `code`", {
      tokens: Object.keys(tokens),
    });
    if (!tokens.access_token || !tokens.refresh_token) {
      const errorMsg =
        "`access_token` or `refresh_token` not found in the response from Google";
      logger.error(errorMsg);
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
    const primaryEmail = profile.data.emailAddresses?.[0]?.value;
    if (!primaryEmail) {
      logger.error("could not fetch primary email from Google People API");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Could not fetch primary email from Google People API",
        }),
      };
    }
    logger.info("Fetched user email from Google People API", {
      email: primaryEmail,
      profile,
    });

    const results = await userService.upsertGoogleCreds2UserProfile({
      authSub: stateData.authSub,
      primaryEmail,
      creds: tokens,
    });
    logger.info("Google Calendar connection upserted", { results });

    // Redirect to calendar page
    return {
      statusCode: 302,
      headers: {
        Location: stateData.redirectTo,
      },
      body: "",
    };
  } catch (error) {
    logger.error("Error in OAuth callback:", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
