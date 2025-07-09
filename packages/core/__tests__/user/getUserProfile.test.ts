import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { addUserProfile } from "../../src/user/addUserProfile";
import { getUserProfile } from "../../src/user/getUserProfile";
import { removeUser } from "../../src/user/removeUser";
import { UserProfile } from "../../src/user/userProfile";

describe("getUserProfile Integration Tests", () => {
  let client: DynamoDBDocumentClient;
  const testAuthSub = "test-get-user-" + Date.now();

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

  it("should successfully retrieve existing user profile", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1", "group2"]),
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it
    const result = await getUserProfile(client, testAuthSub);

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub);
    expect(result.groups).toEqual(new Set(["group1", "group2"]));
  });

  it("should successfully retrieve user profile with Google credentials", async () => {
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

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it
    const result = await getUserProfile(client, testAuthSub + "-2");

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub + "-2");
    expect(result.groups).toEqual(new Set(["group1"]));
    expect(result["google-test@example.com"]).toBeDefined();
    expect(result["google-test@example.com"].access_token).toBe(
      "access-token-123",
    );
    expect(result["google-test@example.com"].refresh_token).toBe(
      "refresh-token-123",
    );
  });

  it("should successfully retrieve user profile with multiple integrations", async () => {
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

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it
    const result = await getUserProfile(client, testAuthSub + "-3");

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub + "-3");
    expect(result.groups).toEqual(new Set(["group1", "group2"]));
    expect(result["google-work@example.com"]).toBeDefined();
    expect(result["google-personal@example.com"]).toBeDefined();
    expect(result["icsfeed-vacation"]).toBe("https://example.com/vacation.ics");
  });

  it("should throw error when user profile does not exist", async () => {
    const nonExistentAuthSub = "non-existent-auth-sub-" + Date.now();

    await expect(getUserProfile(client, nonExistentAuthSub)).rejects.toThrow(
      "User profile not found",
    );
  });

  it("should retrieve user profile with consistent read", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1"]),
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it with consistent read
    const result = await getUserProfile(client, testAuthSub, {
      consistentRead: true,
    });

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub);
    expect(result.groups).toEqual(new Set(["group1"]));
  });

  it("should retrieve user profile with eventual consistency (default)", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1"]),
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it with eventual consistency (default)
    const result = await getUserProfile(client, testAuthSub);

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub);
    expect(result.groups).toEqual(new Set(["group1"]));
  });

  it("should handle undefined consistentRead parameter", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: new Set(["group1"]),
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    // Then retrieve it with undefined consistentRead
    const result = await getUserProfile(client, testAuthSub, undefined);

    expect(result).toBeDefined();
    expect(result.authSub).toBe(testAuthSub);
    expect(result.groups).toEqual(new Set(["group1"]));
  });
});
