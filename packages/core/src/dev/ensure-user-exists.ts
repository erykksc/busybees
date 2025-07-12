import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { addUserProfile } from "../user/addUserProfile";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

/**
 * Ensures a Cognito user exists, is confirmed, and returns an Id token.
 *
 * @param username Email or username of the user
 * @param password User's password
 * @returns JSON object with token or error info
 */
export async function ensureUserExistsAndLogin(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  idToken?: string;
  error?: { name: string; message: string };
}> {
  let userExists = false;

  try {
    await client.send(
      new AdminGetUserCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
      }),
    );
    userExists = true;
    console.error(`User ${username} already exists. Skipping creation.`);
  } catch (error: any) {
    if (error.name === "UserNotFoundException") {
      console.error("User does not exist. Proceeding to create user...");
    } else {
      console.error("Error checking user existence:", error);
      return {
        success: false,
        message: "Error checking user existence.",
        error: {
          name: error.name,
          message: error.message,
        },
      };
    }
  }

  if (!userExists) {
    console.error(`Creating user ${username}...`);

    const createdResponse = await client.send(
      new AdminCreateUserCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
        UserAttributes: [{ Name: "email", Value: username }],
        MessageAction: "SUPPRESS",
      }),
    );

    console.error("User created:", JSON.stringify(createdResponse, null, 2));

    console.error("Setting user password...");

    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );
  }

  let accessToken = "";
  let authSub = "";

  try {
    console.error(`Attempting login for ${username}...`);

    const response = await client.send(
      new AdminInitiateAuthCommand({
        UserPoolId: Resource.MyUserPool.id,
        ClientId: Resource.MyUserPoolClient.id,
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    );
    accessToken = response.AuthenticationResult?.AccessToken ?? "";
    if (!accessToken) {
      throw new Error("No access token received from authentication.");
    }

    const idToken = response.AuthenticationResult?.IdToken ?? "";
    if (!idToken) {
      throw new Error("No ID token received from authentication.");
    }

    const decoded = jwt.decode(idToken);
    authSub = decoded?.sub as string;
    if (!authSub) {
      throw new Error("No authSub found in ID token.");
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to authenticate user.",
      error: {
        name: error.name,
        message: error.message,
      },
    };
  }

  try {
    console.error("Creating user profile in DynamoDB...");

    const dbClient = new DynamoDBClient({
      region: Resource.AwsRegion.value,
    });
    const docClient = DynamoDBDocumentClient.from(dbClient);

    const addProfileResponse = await addUserProfile(docClient, {
      authSub,
      username,
    });
    console.error(
      "User profile added:",
      JSON.stringify(addProfileResponse, null, 2),
    );
  } catch (error: any) {
    console.error("Error adding user profile:", error);
  }

  const result = {
    success: true,
    message: `User ${username} ensured and logged in.`,
    accessToken,
    authSub,
  };

  return result;
}
