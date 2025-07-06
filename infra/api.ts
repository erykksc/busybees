import db from "./db";
import secrets from "./secrets";
import { userPool, userPoolClient } from "./auth";

export const apiGateway = new sst.aws.ApiGatewayV2("MyApi", {
  // domain:
  //   $app.stage !== "prod"
  //     ? undefined
  //     : {
  //         name: $interpolate`api.${$app.stage}.${$app.name}.eryk.one`,
  //         dns: sst.vercel.dns({
  //           domain: `eryk.one`,
  //         }),
  //       },
  link: [
    db.usersTable,
    secrets.googleClientId,
    secrets.googleClientSecret,
    secrets.googleRedirectUri,
    userPoolClient,
  ],
  transform: {
    route: {
      handler: {
        logging: {
          format: "json",
        },
      },
    },
  },
});

export const apiGatewayAuthorizer = apiGateway.addAuthorizer({
  name: "myCognitoAuthorizer",
  jwt: {
    audiences: [userPoolClient.id],
    issuer: $interpolate`https://cognito-idp.${aws.getArnOutput(userPool).region}.amazonaws.com/${userPool.id}`,
  },
});

apiGateway.route("GET /api/public", "api/packages/functions/src/public.main");
apiGateway.route(
  "GET /api/private",
  "api/packages/functions/src/private.main",
  {
    auth: { jwt: { authorizer: apiGatewayAuthorizer.id } },
  },
);

// OAuth routes
apiGateway.route(
  "GET /api/oauth/google/start",
  "api/packages/functions/src/oauth/google/start.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
apiGateway.route(
  "GET /api/oauth/google/callback",
  "api/packages/functions/src/oauth/google/callback.main",
);

// User routes
apiGateway.route(
  "GET /api/user/calendars",
  "api/packages/functions/src/user/calendars.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
