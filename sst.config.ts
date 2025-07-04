/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "busybees",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: true,
        "@pulumiverse/vercel": true,
      },
    };
  },
  async run() {
    const auth = await import("./infra/auth");
    await import("./infra/db");
    await import("./infra/secrets");
    const { apiGateway } = await import("./infra/api");
    const { website } = await import("./infra/frontend");

    // Start a proxy server so that oauth callbacks will be proxied to the changing aws gateway url
    // Additionally we can use the local API in the frontend
    new sst.x.DevCommand("LocalApiProxy", {
      link: [apiGateway],
      dev: {
        autostart: true,
        command: $interpolate`lcp --port 8010 --proxyUrl ${apiGateway.url} --proxyPartial ""`,
      },
    });

    return {
      SiteUrl: website.url,
      UserPoolId: auth.userPool.id,
      IdentityPoolId: auth.identityPool.id,
      UserPoolClientId: auth.userPoolClient.id,
      AwsRegion: aws.getRegionOutput().name,
    };
  },
});
