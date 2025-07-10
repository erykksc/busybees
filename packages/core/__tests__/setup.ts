import { ensureUserExistsAndLogin } from "@busybees/core/dev";

export const TEST_USER = {
  username: "testuser@example.com",
  password: "SuperSecret123!",
};

export async function createAndGetUserToken(user: {
  username: string;
  password: string;
}) {
  const result = await ensureUserExistsAndLogin(user.username, user.password);

  if (!result.success || !result.idToken) {
    throw new Error(
      `Could not log in test user: ${JSON.stringify(result, null, 2)}`,
    );
  }

  return result.idToken;
}
