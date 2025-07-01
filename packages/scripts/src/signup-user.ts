import { Resource } from "sst";
import { execSync } from "child_process";

/**
 * Script to sign up a new Cognito user
 * Run with: sst shell src/signup-user.ts --username user@example.com --password MyPassword123
 */

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (argName: string): string => {
  const index = args.indexOf(`--${argName}`);
  if (index === -1 || index + 1 >= args.length) {
    throw new Error(`Missing required argument: --${argName}`);
  }
  return args[index + 1];
};

const USERNAME = getArgValue("username");
const PASSWORD = getArgValue("password");

const region = process.env.AWS_REGION || "eu-central-1";

const command = `aws cognito-idp sign-up \
  --region ${region} \
  --client-id ${Resource.MyUserPoolClient.id} \
  --username ${USERNAME} \
  --password ${PASSWORD}`;

console.log("Executing signup command...");
console.log(command);
console.log("---");

try {
  const result = execSync(command, { encoding: "utf-8" });
  console.log("Success:", result);
} catch (error: any) {
  console.error("Error:", error.message);
  if (error.stdout) console.log("stdout:", error.stdout);
  if (error.stderr) console.log("stderr:", error.stderr);
}