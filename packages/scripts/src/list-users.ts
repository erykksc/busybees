import { Resource } from "sst";
import { execSync } from "child_process";

/**
 * Script to list all users in the Cognito user pool
 * Run with: sst shell src/list-users.ts
 */

const region = process.env.AWS_REGION || "eu-central-1";

const command = `aws cognito-idp list-users \
  --region ${region} \
  --user-pool-id ${Resource.MyUserPool.id}`;

console.log("Executing list users command...");
console.log(command);
console.log("---");

try {
  const result = execSync(command, { encoding: "utf-8" });
  console.log("Result:", result);
} catch (error: any) {
  console.error("Error:", error.message);
  if (error.stdout) console.log("stdout:", error.stdout);
  if (error.stderr) console.log("stderr:", error.stderr);
}
