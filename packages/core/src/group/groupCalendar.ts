export interface GroupCalendar {
  groupId: string; // Group ID (partition key)
  inviteCode: string; // Unique invite code for the group, used as alternative partition key
  name: string; // Name chosen by the group owner
  owner: string; // User authSub (Cognito sub) of the group owner
  members: Set<string>; // Set of user authSubs (Cognito sub)
}
