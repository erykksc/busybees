import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getArgValue, defaultUsername } from "./utils";

/**
 * Script to confirm a Cognito user signup (skip email verification)
 * Run with: sst shell src/confirm-signup.ts --username user@example.com
 */

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

async function confirmSignup() {
  const command = new AdminConfirmSignUpCommand({
    UserPoolId: Resource.MyUserPool.id,
    Username: getArgValue("username", defaultUsername),
  });

  await client.send(command);

  console.log("User signup successfully confirmed.");
}

confirmSignup().catch((error) => {
  console.error("Error confirming signup:", error);
});
