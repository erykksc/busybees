export const userPool = new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"],
});

export const userPoolClient = userPool.addClient("MyUserPoolClient", {
  transform: {
    client: {
      callbackUrls: ["http://localhost:5173/auth-callback"],
      logoutUrls: ["http://localhost:5173/logout"],
      explicitAuthFlows: [
        "ALLOW_USER_SRP_AUTH", // Your current Cognito UI auth
        "ALLOW_REFRESH_TOKEN_AUTH", // Essential for token refresh
        "ALLOW_ADMIN_USER_PASSWORD_AUTH", // For your admin script
      ],
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
