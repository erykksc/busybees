import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

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
) {
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

    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
        UserAttributes: [{ Name: "email", Value: username }],
        MessageAction: "SUPPRESS",
      }),
    );

    console.error("Setting user password...");

    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );

    console.error("Confirming user signup...");

    await client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: Resource.MyUserPool.id,
        Username: username,
      }),
    );

    console.error(`User ${username} created and confirmed.`);
  }

  try {
    console.error(`Attempting login for ${username}...`);

    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: Resource.MyUserPool.id,
      ClientId: Resource.MyUserPoolClient.id,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await client.send(authCommand);

    const token = response.AuthenticationResult?.IdToken || null;

    const result = {
      success: true,
      message: `User ${username} ensured and logged in.`,
      idToken: token,
    };

    return result;
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
}
