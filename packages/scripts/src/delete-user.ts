import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getArgValue, defaultUsername } from "./utils";

/**
 * Script to delete a Cognito user
 * Run with: sst shell src/delete-user.ts --username user@example.com
 */

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

async function deleteUser() {
  const command = new AdminDeleteUserCommand({
    UserPoolId: Resource.MyUserPool.id,
    Username: getArgValue("username", defaultUsername),
  });

  await client.send(command);

  console.log("User successfully deleted.");
}

deleteUser().catch((error) => {
  console.error("Error deleting user:", error);
});
