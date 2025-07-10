import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { addUserProfile } from "../../src/user/addUserProfile";
import { getUserProfile } from "../../src/user/getUserProfile";
import { removeUser } from "../../src/user/removeUser";
import { upsertGoogleCalendarInUserProfile } from "../../src/user/upsertGoogleTokens";
import { UserProfile } from "../../src/user/userProfile";
import { Auth } from "googleapis";

describe("upsertGoogleCalendarInUserProfile Integration Tests", () => {
  let client: DynamoDBDocumentClient;
  const testAuthSub = "test-upsert-google-" + Date.now();

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

  it("should successfully upsert Google credentials to existing user profile", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: ["group1"],
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    // Upsert Google credentials
    const result = await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub,
      "test@example.com",
      googleCreds,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify the credentials were added
    const updatedProfile = await getUserProfile(client, testAuthSub);
    expect(updatedProfile["google-test@example.com"]).toBeDefined();
    expect(updatedProfile["google-test@example.com"].access_token).toBe(
      "access-token-123",
    );
    expect(updatedProfile["google-test@example.com"].refresh_token).toBe(
      "refresh-token-123",
    );
  });

  it("should successfully update existing Google credentials", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-2",
      groups: ["group1"],
      "google-test@example.com": {
        access_token: "old-access-token",
        refresh_token: "old-refresh-token",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1111111111,
      },
    };

    // First add the user profile with existing Google credentials
    await addUserProfile(client, userProfile);

    const newGoogleCreds: Auth.Credentials = {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      scope:
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email",
      token_type: "Bearer",
      expiry_date: 2222222222,
    };

    // Update Google credentials
    const result = await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub + "-2",
      "test@example.com",
      newGoogleCreds,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify the credentials were updated
    const updatedProfile = await getUserProfile(client, testAuthSub + "-2");
    expect(updatedProfile["google-test@example.com"]).toBeDefined();
    expect(updatedProfile["google-test@example.com"].access_token).toBe(
      "new-access-token",
    );
    expect(updatedProfile["google-test@example.com"].refresh_token).toBe(
      "new-refresh-token",
    );
    expect(updatedProfile["google-test@example.com"].expiry_date).toBe(
      2222222222,
    );
  });

  it("should successfully add multiple Google accounts", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub + "-3",
      groups: ["group1"],
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    const workCreds: Auth.Credentials = {
      access_token: "work-access-token",
      refresh_token: "work-refresh-token",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    const personalCreds: Auth.Credentials = {
      access_token: "personal-access-token",
      refresh_token: "personal-refresh-token",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    // Add work account
    await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub + "-3",
      "work@example.com",
      workCreds,
    );

    // Add personal account
    await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub + "-3",
      "personal@example.com",
      personalCreds,
    );

    // Verify both accounts were added
    const updatedProfile = await getUserProfile(client, testAuthSub + "-3");
    expect(updatedProfile["google-work@example.com"]).toBeDefined();
    expect(updatedProfile["google-work@example.com"].access_token).toBe(
      "work-access-token",
    );
    expect(updatedProfile["google-personal@example.com"]).toBeDefined();
    expect(updatedProfile["google-personal@example.com"].access_token).toBe(
      "personal-access-token",
    );
  });

  it("should throw error when authSub is empty", async () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    await expect(
      upsertGoogleCalendarInUserProfile(
        client,
        "",
        "test@example.com",
        googleCreds,
      ),
    ).rejects.toThrow("authSub is required");
  });

  it("should throw error when authSub is null", async () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    await expect(
      upsertGoogleCalendarInUserProfile(
        client,
        null as any,
        "test@example.com",
        googleCreds,
      ),
    ).rejects.toThrow("authSub is required");
  });

  it("should throw error when authSub is undefined", async () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    await expect(
      upsertGoogleCalendarInUserProfile(
        client,
        undefined as any,
        "test@example.com",
        googleCreds,
      ),
    ).rejects.toThrow("authSub is required");
  });

  it("should handle credentials with various OAuth fields", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: ["group1"],
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    const comprehensiveCreds: Auth.Credentials = {
      access_token: "comprehensive-access-token",
      refresh_token: "comprehensive-refresh-token",
      scope:
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email profile",
      token_type: "Bearer",
      expiry_date: 1234567890,
      id_token: "id-token-123",
    };

    // Upsert comprehensive credentials
    const result = await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub,
      "comprehensive@example.com",
      comprehensiveCreds,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify all credential fields were stored
    const updatedProfile = await getUserProfile(client, testAuthSub);
    expect(updatedProfile["google-comprehensive@example.com"]).toBeDefined();
    expect(
      updatedProfile["google-comprehensive@example.com"].access_token,
    ).toBe("comprehensive-access-token");
    expect(
      updatedProfile["google-comprehensive@example.com"].refresh_token,
    ).toBe("comprehensive-refresh-token");
    expect(updatedProfile["google-comprehensive@example.com"].id_token).toBe(
      "id-token-123",
    );
  });

  it("should handle email addresses with special characters", async () => {
    const userProfile: UserProfile = {
      authSub: testAuthSub,
      groups: ["group1"],
    };

    // First add the user profile
    await addUserProfile(client, userProfile);

    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    // Test with email containing dots and plus signs
    const complexEmail = "user.name+tag@example.com";

    // Upsert Google credentials with complex email
    const result = await upsertGoogleCalendarInUserProfile(
      client,
      testAuthSub,
      complexEmail,
      googleCreds,
    );

    expect(result).toBeDefined();
    expect(result.$metadata?.httpStatusCode).toBe(200);

    // Verify the credentials were added with the complex email
    const updatedProfile = await getUserProfile(client, testAuthSub);
    expect(updatedProfile[`google-${complexEmail}`]).toBeDefined();
    expect(updatedProfile[`google-${complexEmail}`].access_token).toBe(
      "access-token-123",
    );
  });
});
