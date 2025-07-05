export const userPool = new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"],
});

export const userPoolClient = userPool.addClient("MyUserPoolClient", {
  transform: {
    client: {
      callbackUrls: ["http://localhost:5173/auth-callback"],
      logoutUrls: ["http://localhost:5173/logout"],
    },
  },
});

export const userPoolDomain = new aws.cognito.UserPoolDomain(
  "MyUserPoolDomain",
  {
    userPoolId: userPool.id,
    domain: `${$app.name}-${$app.stage}-auth`,
  },
);

export const userPoolDomainUrl = $interpolate`https://${userPoolDomain.domain}.auth.${aws.getRegionOutput().name}.amazoncognito.com`;

export default {
  userPool,
  userPoolClient,
  userPoolDomain,
  userPoolDomainUrl,
};
