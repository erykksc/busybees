import { beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { Resource } from "sst";

// Test user credentials
export const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
  authSub: "", // Will be populated after user creation
};

export let TEST_JWT_TOKEN: string = "";

export async function createTestUser() {
  try {
    // Create user using the existing admin script
    const createUserCommand = `sst shell -- tsx ../scripts/src/admin-create-user.ts --email ${TEST_USER.email} --password ${TEST_USER.password}`;
    console.log("Creating test user...");
    execSync(createUserCommand, { stdio: "inherit" });

    // Get user details to extract authSub
    const getUserCommand = `aws cognito-idp admin-get-user --user-pool-id ${Resource.MyUserPool.id} --username ${TEST_USER.email}`;
    const userResult = execSync(getUserCommand, { encoding: "utf-8" });
    const userData = JSON.parse(userResult);

    // Extract authSub from user attributes
    const subAttribute = userData.UserAttributes.find(
      (attr: any) => attr.Name === "sub",
    );
    if (subAttribute) {
      TEST_USER.authSub = subAttribute.Value;
    }

    console.log("Test user created successfully:", TEST_USER.email);
  } catch (error) {
    console.log("Test user may already exist, continuing...");
  }
}

export async function getTestJwtToken(): Promise<string> {
  if (TEST_JWT_TOKEN) {
    return TEST_JWT_TOKEN;
  }

  try {
    // Authenticate and get JWT token
    const authCommand = `aws cognito-idp admin-initiate-auth \
      --user-pool-id ${Resource.MyUserPool.id} \
      --client-id ${Resource.MyUserPoolClient.id} \
      --auth-flow ADMIN_NO_SRP_AUTH \
      --auth-parameters USERNAME=${TEST_USER.email},PASSWORD=${TEST_USER.password}`;

    const authResult = execSync(authCommand, { encoding: "utf-8" });
    const authData = JSON.parse(authResult);

    TEST_JWT_TOKEN = authData.AuthenticationResult.AccessToken;
    console.log("JWT token obtained successfully");
    return TEST_JWT_TOKEN;
  } catch (error) {
    console.error("Failed to get JWT token:", error);
    throw error;
  }
}

export function makeAuthenticatedRequest(path: string, options: any = {}) {
  const token = TEST_JWT_TOKEN;
  if (!token) {
    throw new Error("No JWT token available. Call getTestJwtToken() first.");
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

// Global test setup
beforeAll(async () => {
  await createTestUser();
  await getTestJwtToken();
}, 30000); // 30 second timeout for setup
