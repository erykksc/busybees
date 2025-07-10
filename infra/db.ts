export const userProfilesTable = new sst.aws.Dynamo("UserProfilesTable", {
  fields: {
    authSub: "string",
  },
  primaryIndex: { hashKey: "authSub" },
});

export const groupCalendarsTable = new sst.aws.Dynamo("GroupCalendarsTable", {
  fields: {
    groupId: "string",
    inviteCode: "string",
  },
  primaryIndex: { hashKey: "groupId" },
  globalIndexes: {
    inviteCodeIndex: {
      hashKey: "inviteCode",
    },
  },
});

export default { userProfilesTable, groupCalendarsTable };
