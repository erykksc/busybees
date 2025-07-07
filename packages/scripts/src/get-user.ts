import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getArgValue, defaultUsername } from "./utils";

/**
 * Script to get Cognito user details
 * Run with: sst shell src/get-user.ts --username user@example.com
 */

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

async function getUser() {
  const command = new AdminGetUserCommand({
    UserPoolId: Resource.MyUserPool.id,
    Username: getArgValue("username", defaultUsername),
  });

  const response = await client.send(command);

  console.log("AdminGetUser response:", response);
}

getUser().catch((error) => {
  console.error("Error fetching user details:", error);
});
