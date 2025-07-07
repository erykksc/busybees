import { ensureUserExistsAndLogin } from "@busybees/core/dev";

export const TEST_USER = {
  username: "testuser@example.com",
  password: "SuperSecret123!",
};

export async function getTestUserToken() {
  const result = await ensureUserExistsAndLogin(
    TEST_USER.username,
    TEST_USER.password,
  );

  if (!result.success || !result.idToken) {
    throw new Error(
      `Could not log in test user: ${JSON.stringify(result, null, 2)}`,
    );
  }

  return result.idToken;
}
