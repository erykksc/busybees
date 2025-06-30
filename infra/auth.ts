import { apiGateway } from "./api";
export const userPool = new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"],
});

export const userPoolClient = userPool.addClient("MyUserPoolClient");

export const userPoolDomain = new aws.cognito.UserPoolDomain(
  "MyUserPoolDomain",
  {
    userPoolId: userPool.id,
    domain: `${$app.stage}-auth`,
  },
);

sst.Linkable.wrap(aws.cognito.UserPoolDomain, (userPoolDomain) => ({
  properties: {
    domain: userPoolDomain.domain,
  },
}));

export const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
  userPools: [
    {
      userPool: userPool.id,
      client: userPoolClient.id,
    },
  ],
  permissions: {
    authenticated: [
      {
        actions: ["execute-api:*"],
        resources: [
          $concat(
            "arn:aws:execute-api:",
            aws.getRegionOutput().name,
            ":",
            aws.getCallerIdentityOutput({}).accountId,
            ":",
            apiGateway.nodes.api.id,
            "/*/*/*",
          ),
        ],
      },
    ],
  },
});

export default { userPool, identityPool, userPoolClient, userPoolDomain };
