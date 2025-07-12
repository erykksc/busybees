import { Auth } from "googleapis";

// NOTE: allow specifying which calendars are used to show the status busy
// for now the google api is queried for busy statuses
export class UserProfile {
  authSub: string; // Cognito sub - partition key
  username: string; // User defined username
  [key: `google-${string}`]: Auth.Credentials;
  [key: `microsoft-${string}`]: any;
  [key: `icsfeed-${string}`]: string;
  groupsOwner?: Set<string>;
  groupsMember?: Set<string>;

  constructor(data: {
    authSub: string;
    username: string;
    groupsOwner?: Set<string>;
    groupsMember?: Set<string>;
    [key: `google-${string}`]: Auth.Credentials;
    [key: `microsoft-${string}`]: any;
    [key: `icsfeed-${string}`]: string;
  }) {
    const { authSub, username, groupsOwner, groupsMember, ...credentials } =
      data;
    if (!authSub || typeof authSub !== "string") {
      throw new Error("authSub must be a non-empty string");
    }
    this.authSub = data.authSub;

    if (!username || typeof username !== "string") {
      throw new Error("username must be a non-empty string");
    }
    this.username = username;

    if (groupsOwner && groupsOwner.size === 0) {
      throw new Error("groupsOwner cannot be an empty Set");
    }
    this.groupsOwner = groupsOwner;

    if (groupsMember && groupsMember.size === 0) {
      throw new Error("groupsMember cannot be an empty Set");
    }
    this.groupsMember = groupsMember;

    // Narrowing helpers
    const isGoogleKey = (k: string): k is `google-${string}` =>
      k.startsWith("google-");
    const isMsKey = (k: string): k is `microsoft-${string}` =>
      k.startsWith("microsoft-");
    const isFeedKey = (k: string): k is `icsfeed-${string}` =>
      k.startsWith("icsfeed-");

    // Iterate!
    for (const key in credentials) {
      const val = credentials[key as any];
      if (isGoogleKey(key)) {
        this[key] = val;
      } else if (isMsKey(key)) {
        this[key] = val;
      } else if (isFeedKey(key)) {
        this[key] = val;
      } else {
        throw new Error(
          `Unknown credentials key: ${key}. Expected format is 'google-<email>', 'microsoft-<email>', or 'icsfeed-<name>'`,
        );
      }
    }
    return this;
  }

  // Method to create a UserProfile instance from a record, dynamodb's Item
  // This method should only be used to read in already created UserProfiles
  static fromRecord(record: Record<string, any>): UserProfile {
    const { authSub, username, groupsMember, groupsOwner, ...credentials } =
      record;
    return new UserProfile({
      authSub,
      username,
      groupsOwner,
      groupsMember,
      ...credentials,
    });
  }

  toDto(): UserProfileDto {
    const groups: GroupInfoDto[] = [];
    this.groupsMember?.forEach((group) => {
      groups.push({
        name: group,
        isOwner: this.groupsOwner?.has(group) || false,
      });
    });
    // sort groups alphabetically based on group name
    groups.sort((a, b) => a.name.localeCompare(b.name));

    // Get google account names using tokens
    const googleAccountNames: string[] = [];
    Object.keys(this).forEach((key) => {
      if (!key.startsWith("google-")) {
        return;
      }

      const accountEmail = key.replace("google-", "");
      googleAccountNames.push(accountEmail);
    });
    return {
      authSub: this.authSub,
      username: this.username,
      groups,
      googleAccountNames,
    };
  }
}

export interface GroupInfoDto {
  name: string;
  isOwner: boolean;
}
export interface UserProfileDto {
  authSub: string; // id of the user
  username: string;
  groups: GroupInfoDto[];
  googleAccountNames: string[]; // List of Google Account names (primary email addresses)
}
