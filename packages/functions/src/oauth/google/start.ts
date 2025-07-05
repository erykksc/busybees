import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { google } from "googleapis";
import { Resource } from "sst";
import { encodeOauthState } from "@busybees/core";
import crypto from "crypto";

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const clientId = event.requestContext.authorizer?.jwt?.claims?.client_id;
    if (!clientId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "User not authenticated" }),
      };
    }

    const referer = event.headers?.referer;
    if (!referer) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Referer not specified in headers" }),
      };
    }

    const oauth2Client = new google.auth.OAuth2({
      clientId: Resource.GoogleClientId.value,
      clientSecret: Resource.GoogleClientSecret.value,
      redirectUri: Resource.GoogleRedirectUri.value,
    });

    const csrfToken = crypto.randomBytes(32).toString("hex");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      response_type: "code",
      prompt: "consent",
      state: encodeOauthState({
        clientId: clientId,
        redirectTo: referer,
        csrfToken: csrfToken,
      }),
    });

    const cookie = [
      `oauth_csrf_token=${csrfToken}`,
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Max-Age=1200", // 20 minutes
      "Path=/api/oauth/",
    ].join("; ");

    return {
      statusCode: 200,
      headers: {
        ContentType: "application/json",
        "Set-Cookie": cookie,
      },
      body: JSON.stringify({
        redirectUrl: authUrl,
      }),
    };
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
