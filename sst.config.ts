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
    await import("./infra/api");
    await import("./infra/dev");
    const { website } = await import("./infra/frontend");

    const awsRegion = new sst.Linkable("AwsRegion", {
      properties: {
        value: aws.getRegionOutput().name,
      },
    });

    return {
      SiteUrl: website.url,
      UserPoolId: auth.userPool.id,
      UserPoolClientId: auth.userPoolClient.id,
      AwsRegion: awsRegion,
    };
  },
});
