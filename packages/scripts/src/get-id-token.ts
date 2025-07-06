import { Resource } from "sst";
import { execSync } from "child_process";
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (argName: string, defaultVal?: string): string => {
  const index = args.indexOf(`--${argName}`);
  if (index === -1 || index + 1 >= args.length) {
    if (!defaultVal) {
      throw new Error(`Missing required argument: --${argName}`);
    }
    return defaultVal;
  }
  return args[index + 1];
};

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
