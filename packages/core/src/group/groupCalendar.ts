export interface GroupCalendar {
  groupId: string; // Group ID (partition key), acts as a name
  inviteCode: string; // Unique invite code for the group, used as alternative partition key
  owner: string; // User authSub (Cognito sub) of the group owner
  members: Set<string>; // Set of user authSubs (Cognito sub)
}

export interface GroupCalendarDto {
  inviteUrl: string; // URL to join the group using the invite code
  name: string;
  owner: string;
  members: string[]; // A list of the members usernames (sorted alphabetically)
  makeEventsPublic?: boolean; // A boolean indicating if the events of individual group members should be shown
}
