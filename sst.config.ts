/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "busybees",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const { api } = await import("./infra/api");
    const { website } = await import("./infra/frontend");

    return {
      MyBucket: storage.bucket.name,
      SiteUrl: website.url,
      ApiEndpoint: api.url,
    };
  },
});
