export const api = new sst.aws.Function("MyApi", {
  url: true,
  handler: "packages/functions/src/api.handler",
});
