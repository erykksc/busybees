import db from "./db";
import secrets from "./secrets";
import { userPool, userPoolClient } from "./auth";
import { redis } from "./cache";

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
    db.userProfilesTable,
    db.groupCalendarsTable,
    secrets.googleClientId,
    secrets.googleClientSecret,
    secrets.googleRedirectUri,
    userPoolClient,
    redis,
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

// Test Endpoints
apiGateway.route("GET /api/public", "packages/functions/src/api/public.main");
apiGateway.route(
  "GET /api/private",
  "packages/functions/src/api/private.main",
  {
    auth: { jwt: { authorizer: apiGatewayAuthorizer.id } },
  },
);

// OAuth Endpoints
apiGateway.route(
  "GET /api/oauth/google/start",
  "packages/functions/src/api/oauth/google/start.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
apiGateway.route(
  "GET /api/oauth/google/callback",
  "packages/functions/src/api/oauth/google/callback.main",
);

// User Endpoints
apiGateway.route(
  "GET /api/user/profile",
  "packages/functions/src/api/user/profile.GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
apiGateway.route(
  "POST /api/user/profile",
  "packages/functions/src/api/user/profile.POST.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
apiGateway.route(
  "GET /api/user/events",
  "packages/functions/src/api/user/events.GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
apiGateway.route(
  "GET /api/user/freebusy",
  "packages/functions/src/api/user/freebusy.GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

// Group Endpoints
apiGateway.route(
  "POST /api/groups",
  "packages/functions/src/api/groups.POST.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "GET /api/groups/join/{inviteCode}",
  "packages/functions/src/api/groups/[inviteCode].GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "POST /api/groups/{groupId}/remove-member",
  "packages/functions/src/api/groups/[groupId]/remove-member.POST.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "DELETE /api/groups/{groupId}",
  "packages/functions/src/api/groups/[groupId].DELETE.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "GET /api/groups/{groupId}",
  "packages/functions/src/api/groups/[groupId].GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "POST /api/groups/{groupId}",
  "packages/functions/src/api/groups/[groupId].POST.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "GET /api/groups/{groupId}/freebusy",
  "packages/functions/src/api/groups/[groupId]/freebusy.GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "GET /api/groups/{groupId}/events",
  "packages/functions/src/api/groups/[groupId]/events.GET.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);

apiGateway.route(
  "POST /api/groups/{groupId}/events",
  "packages/functions/src/api/groups/[groupId]/events.POST.main",
  { auth: { jwt: { authorizer: apiGatewayAuthorizer.id } } },
);
