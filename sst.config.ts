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
    const auth = await import("./infra/auth");
    await import("./infra/api");
    const { website } = await import("./infra/frontend");

    return {
      SiteUrl: website.url,
      CognitoDomain: auth.userPoolDomain.domain,
      UserPoolId: auth.userPool.id,
      IdentityPoolId: auth.identityPool.id,
      AuthDomain: $interpolate`https://${auth.userPoolDomain.domain}.auth.${aws.getRegionOutput().name}.amazoncognito.com`,
      AuthClientId: auth.userPoolClient.id,
    };
  },
});
