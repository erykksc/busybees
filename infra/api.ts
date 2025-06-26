import { bucket } from "./storage";

export const api = new sst.aws.Function("MyApi", {
  url: true,
  link: [bucket],
  handler: "packages/functions/src/api.handler",
});
