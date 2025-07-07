import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getArgValue } from "./utils";

const USERNAME = getArgValue("username", "user@example.com");
const PASSWORD = getArgValue("password", "Passw0rd!");

const client = new CognitoIdentityProviderClient({
  region: Resource.AwsRegion.value,
});

async function adminLogin() {
  const command = new AdminInitiateAuthCommand({
    UserPoolId: Resource.MyUserPool.id,
    ClientId: Resource.MyUserPoolClient.id,
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    AuthParameters: {
      USERNAME,
      PASSWORD,
    },
  });

  const response = await client.send(command);
  console.log(response.AuthenticationResult?.IdToken);
}

adminLogin().catch(console.error);
