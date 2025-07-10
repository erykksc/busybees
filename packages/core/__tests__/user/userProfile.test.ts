import { describe, it, expect } from "vitest";
import { UserProfile } from "../../src/user/userProfile";
import { Auth } from "googleapis";

describe("UserProfile Type Tests", () => {
  it("should create a valid UserProfile with required fields", () => {
    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1", "group2"],
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual(["group1", "group2"]);
  });

  it("should create a UserProfile with Google credentials", () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1"],
      "google-test@example.com": googleCreds,
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual(["group1"]);
    expect(userProfile["google-test@example.com"]).toBe(googleCreds);
    expect(userProfile["google-test@example.com"].access_token).toBe(
      "access-token-123",
    );
  });

  it("should create a UserProfile with multiple Google accounts", () => {
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

    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1", "group2"],
      "google-work@example.com": workCreds,
      "google-personal@example.com": personalCreds,
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual(["group1", "group2"]);
    expect(userProfile["google-work@example.com"]).toBe(workCreds);
    expect(userProfile["google-personal@example.com"]).toBe(personalCreds);
  });

  it("should create a UserProfile with ICS feed URLs", () => {
    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1"],
      "icsfeed-vacation": "https://example.com/vacation.ics",
      "icsfeed-holidays": "https://example.com/holidays.ics",
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual(["group1"]);
    expect(userProfile["icsfeed-vacation"]).toBe(
      "https://example.com/vacation.ics",
    );
    expect(userProfile["icsfeed-holidays"]).toBe(
      "https://example.com/holidays.ics",
    );
  });

  it("should create a UserProfile with mixed integrations", () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1", "group2", "group3"],
      "google-work@example.com": googleCreds,
      "icsfeed-vacation": "https://example.com/vacation.ics",
      "microsoft-outlook@example.com": { some: "microsoft-creds" },
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual(["group1", "group2", "group3"]);
    expect(userProfile["google-work@example.com"]).toBe(googleCreds);
    expect(userProfile["icsfeed-vacation"]).toBe(
      "https://example.com/vacation.ics",
    );
    expect(userProfile["microsoft-outlook@example.com"]).toEqual({
      some: "microsoft-creds",
    });
  });

  it("should handle empty groups array", () => {
    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: [],
    };

    expect(userProfile.authSub).toBe("test-auth-sub-123");
    expect(userProfile.groups).toEqual([]);
  });

  it("should handle Google credentials with all possible fields", () => {
    const comprehensiveCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope:
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email profile",
      token_type: "Bearer",
      expiry_date: 1234567890,
      id_token: "id-token-123",
    };

    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1"],
      "google-comprehensive@example.com": comprehensiveCreds,
    };

    expect(userProfile["google-comprehensive@example.com"].access_token).toBe(
      "access-token-123",
    );
    expect(userProfile["google-comprehensive@example.com"].refresh_token).toBe(
      "refresh-token-123",
    );
    expect(userProfile["google-comprehensive@example.com"].id_token).toBe(
      "id-token-123",
    );
    expect(userProfile["google-comprehensive@example.com"].expiry_date).toBe(
      1234567890,
    );
  });

  it("should handle complex email addresses in field names", () => {
    const googleCreds: Auth.Credentials = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      token_type: "Bearer",
      expiry_date: 1234567890,
    };

    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1"],
      "google-user.name+tag@example.com": googleCreds,
      "icsfeed-company-holidays": "https://company.com/holidays.ics",
    };

    expect(userProfile["google-user.name+tag@example.com"]).toBe(googleCreds);
    expect(userProfile["icsfeed-company-holidays"]).toBe(
      "https://company.com/holidays.ics",
    );
  });

  it("should support type inference for dynamic keys", () => {
    const userProfile: UserProfile = {
      authSub: "test-auth-sub-123",
      groups: ["group1"],
    };

    // These should be type-safe assignments
    const googleKey = "google-test@example.com" as const;
    const icsFeedKey = "icsfeed-vacation" as const;
    const microsoftKey = "microsoft-outlook@example.com" as const;

    userProfile[googleKey] = {
      access_token: "token",
      refresh_token: "refresh",
      scope: "scope",
      token_type: "Bearer",
      expiry_date: 123456,
    };

    userProfile[icsFeedKey] = "https://example.com/vacation.ics";
    userProfile[microsoftKey] = { some: "data" };

    expect(userProfile[googleKey]).toBeDefined();
    expect(userProfile[icsFeedKey]).toBe("https://example.com/vacation.ics");
    expect(userProfile[microsoftKey]).toEqual({ some: "data" });
  });
});
