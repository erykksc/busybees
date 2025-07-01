import { Resource } from "sst";

/**
 * Script to generate AWS CLI commands for Cognito user management
 * Run with: sst shell src/cognito-user-commands.ts
 */

const USERNAME = "erykksc@gmail.com";
const PASSWORD = "Passw0rd!";

// Get current AWS region from the deployment
const region = process.env.AWS_REGION || "eu-central-1";

console.log("=== Cognito Resource Information ===");
console.log(`User Pool ID: ${Resource.MyUserPool.id}`);
console.log(`User Pool Client ID: ${Resource.MyUserPoolClient.id}`);
console.log(`Identity Pool ID: ${Resource.IdentityPool.id}`);
console.log(`AWS Region: ${region}`);

console.log("\n=== AWS CLI Commands ===");

console.log("\n1. Sign up a new user:");
console.log(`aws cognito-idp sign-up \\
  --region ${region} \\
  --client-id ${Resource.MyUserPoolClient.id} \\
  --username ${USERNAME} \\
  --password ${PASSWORD}`);

console.log("\n2. Admin confirm sign-up (to skip email verification):");
console.log(`aws cognito-idp admin-confirm-sign-up \\
  --region ${region} \\
  --user-pool-id ${Resource.MyUserPool.id} \\
  --username ${USERNAME}`);

console.log("\n3. Login URL:");
console.log(`https://${Resource.MyUserPoolDomain.domain}.auth.${region}.amazoncognito.com/login?client_id=${Resource.MyUserPoolClient.id}&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:5173/auth`);

console.log("\n=== Additional Useful Commands ===");

console.log("\n4. List users in the user pool:");
console.log(`aws cognito-idp list-users \\
  --region ${region} \\
  --user-pool-id ${Resource.MyUserPool.id}`);

console.log("\n5. Delete a user:");
console.log(`aws cognito-idp admin-delete-user \\
  --region ${region} \\
  --user-pool-id ${Resource.MyUserPool.id} \\
  --username ${USERNAME}`);

console.log("\n6. Get user details:");
console.log(`aws cognito-idp admin-get-user \\
  --region ${region} \\
  --user-pool-id ${Resource.MyUserPool.id} \\
  --username ${USERNAME}`);