import { Resource } from "sst";
import { execSync } from "child_process";

/**
 * Script to confirm a Cognito user signup (skip email verification)
 * Run with: sst shell src/confirm-signup.ts --username user@example.com
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

const region = process.env.AWS_REGION || "eu-central-1";

const command = `aws cognito-idp admin-confirm-sign-up \
  --region ${region} \
  --user-pool-id ${Resource.MyUserPool.id} \
  --username ${USERNAME}`;

console.log("Executing confirm signup command...");
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
