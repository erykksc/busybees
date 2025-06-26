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
    const { api } = await import("./infra/api");
    const { website } = await import("./infra/frontend");

    return {
      SiteUrl: website.url,
      ApiEndpoint: api.url,
    };
  },
});
