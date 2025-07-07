import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { defaultPassword, defaultUsername, getArgValue } from "./utils";

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

async function signupUser() {
  const command = new SignUpCommand({
    ClientId: Resource.MyUserPoolClient.id,
    Username: getArgValue("username", defaultUsername),
    Password: getArgValue("password", defaultPassword),
  });

  const response = await client.send(command);

  console.log("SignUp response:", response);
}

signupUser().catch((error) => {
  console.error("Error during sign-up:", error);
});
