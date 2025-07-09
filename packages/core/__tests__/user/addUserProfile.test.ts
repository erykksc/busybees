import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { addUserProfile } from "../../src/user/addUserProfile";
import { removeUser } from "../../src/user/removeUser";
import { UserProfile } from "../../src/user/userProfile";

describe("addUserProfile Integration Tests", () => {
  let client: DynamoDBDocumentClient;
  const testAuthSub = "test-auth-sub-" + Date.now();

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

  it("should successfully add a basic user profile", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1", "group2"]),
    };

    const result = await addUserProfile(client, userProfile);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });

  it("should throw error when authSub is empty", async () => {
    const userProfile: UserProfile = {
      authSub: "",
      groups: new Set([]),
    };

    await expect(addUserProfile(client, userProfile)).rejects.toThrow(
      "authSub is required",
    );
  });

  it("should successfully add user profile with Google credentials", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-2",
      groups: new Set(["group1"]),
      "google-test@example.com": {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1234567890,
      },
    };

    const result = await addUserProfile(client, userProfile);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });

  it("should successfully add user profile with multiple integrations", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-3",
      groups: new Set(["group1", "group2"]),
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

    const result = await addUserProfile(client, userProfile);

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);
  });

  it("should fail when trying to add duplicate user profile", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1"]),
    };

    // Add first time - should succeed
    await addUserProfile(client, userProfile);

    // Try to add again - should fail due to ConditionExpression
    await expect(addUserProfile(client, userProfile)).rejects.toThrow();
  });
});

