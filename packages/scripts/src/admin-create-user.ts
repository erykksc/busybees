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

const EMAIL = getArgValue("email");
const PASSWORD = getArgValue("password");

// Check if user already exists
const checkUserCommand = `aws cognito-idp admin-get-user \
  --user-pool-id ${Resource.MyUserPool.id} \
  --username ${EMAIL}`;

console.log("Checking if user already exists...");

try {
  const checkResult = execSync(checkUserCommand, { encoding: "utf-8" });
  console.log(`User ${EMAIL} already exists. Exiting.`);
  process.exit(0);
} catch (error: any) {
  // User doesn't exist, proceed with creation
  if (error.status === 1) {
    console.log("User doesn't exist, proceeding with creation...");
  } else {
    console.error("Error checking user:", error.message);
    process.exit(1);
  }
}

const command = `aws cognito-idp admin-create-user \
  --user-pool-id ${Resource.MyUserPool.id} \
  --username ${EMAIL} \
  --user-attributes Name=email,Value=${EMAIL} \
  --message-action SUPPRESS \
  && aws cognito-idp admin-set-user-password \
  --user-pool-id ${Resource.MyUserPool.id} \
  --username ${EMAIL} \
  --password ${PASSWORD} \
  --permanent`;

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
