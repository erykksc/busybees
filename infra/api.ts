import db from "./db";

export const api = new sst.aws.Function("MyApi", {
  url: true,
  link: [db.eventsTable, db.groupsTable],
  handler: "packages/functions/src/api.handler",
});
