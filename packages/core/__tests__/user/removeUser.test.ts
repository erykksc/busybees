import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { addUserProfile } from "../../src/user/addUserProfile";
import { getUserProfile } from "../../src/user/getUserProfile";
import { removeUser } from "../../src/user/removeUser";
import { UserProfile } from "../../src/user/userProfile";

describe("removeUser Integration Tests", () => {
  let client: DynamoDBDocumentClient;
  const testAuthSub = "test-remove-user-" + Date.now();

  beforeAll(() => {
    client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await removeUser(client, testAuthSub);
      await removeUser(client, testAuthSub + "-2");
      await removeUser(client, testAuthSub + "-3");
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it("should successfully remove existing user profile", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: ["group1", "group2"],
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Verify it exists
    const existingProfile = await getUserProfile(client, testAuthSub);
    expect(existingProfile).toBeDefined();

    // Remove the user profile
    const result = await removeUser(client, testAuthSub);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify it's been removed
    await expect(getUserProfile(client, testAuthSub)).rejects.toThrow(
      "User profile not found",
    );
  });

  it("should successfully remove user profile with Google credentials", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-2",
      groups: ["group1"],
      "google-test@example.com": {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1234567890,
      },
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Verify it exists
    const existingProfile = await getUserProfile(client, testAuthSub + "-2");
    expect(existingProfile).toBeDefined();
    expect(existingProfile["google-test@example.com"]).toBeDefined();

    // Remove the user profile
    const result = await removeUser(client, testAuthSub + "-2");

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify it's been removed
    await expect(getUserProfile(client, testAuthSub + "-2")).rejects.toThrow(
      "User profile not found",
    );
  });

  it("should successfully remove user profile with multiple integrations", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-3",
      groups: ["group1", "group2"],
      "google-work@example.com": {
        access_token: "access-token-work",
        refresh_token: "refresh-token-work",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1234567890,
      },
      "google-personal@example.com": {
        access_token: "access-token-personal",
        refresh_token: "refresh-token-personal",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1234567890,
      },
      "icsfeed-vacation": "https://example.com/vacation.ics",
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Verify it exists
    const existingProfile = await getUserProfile(client, testAuthSub + "-3");
    expect(existingProfile).toBeDefined();
    expect(existingProfile["google-work@example.com"]).toBeDefined();
    expect(existingProfile["google-personal@example.com"]).toBeDefined();
    expect(existingProfile["icsfeed-vacation"]).toBe(
      "https://example.com/vacation.ics",
    );

    // Remove the user profile
    const result = await removeUser(client, testAuthSub + "-3");

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify it's been removed
    await expect(getUserProfile(client, testAuthSub + "-3")).rejects.toThrow(
      "User profile not found",
    );
  });

  it("should throw error when authSub is empty", async () => {
    await expect(removeUser(client, "")).rejects.toThrow("authSub is required");
  });

  it("should throw error when authSub is null", async () => {
    await expect(removeUser(client, null as any)).rejects.toThrow(
      "authSub is required",
    );
  });

  it("should throw error when authSub is undefined", async () => {
    await expect(removeUser(client, undefined as any)).rejects.toThrow(
      "authSub is required",
    );
  });

  it("should succeed when trying to remove non-existent user", async () => {
    const nonExistentAuthSub = "non-existent-auth-sub-" + Date.now();

    // DynamoDB DeleteCommand succeeds even if the item doesn't exist
    const result = await removeUser(client, nonExistentAuthSub);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });
});
