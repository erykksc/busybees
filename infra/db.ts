export const usersTable = new sst.aws.Dynamo("UsersTable", {
  fields: {
    userId: "string",
  },
  primaryIndex: { hashKey: "userId" },
});

// export const eventsTable = new sst.aws.Dynamo("EventsTable", {
//   fields: {
//     groupIdMm: "string",
//     userId: "string",
//     eventId: "string",
//   },
//   primaryIndex: { hashKey: "groupIdMm", rangeKey: "userId" },
//   globalIndexes: {
//     CreatedAtIndex: { hashKey: "userId", rangeKey: "eventId" },
//   },
// });
//
// export const groupsTable = new sst.aws.Dynamo("GroupsTable", {
//   fields: {
//     groupId: "string",
//     memberCount: "number",
//   },
//   primaryIndex: { hashKey: "groupId", rangeKey: "memberCount" },
// });

export default { usersTable };
