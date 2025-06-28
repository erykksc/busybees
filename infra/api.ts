import db from "./db";
import auth from "./auth";

export const api = new sst.aws.ApiGatewayV2("MyApi", {
  link: [auth.userPool, db.eventsTable, db.groupsTable],
  transform: {
    route: {
      args: (props) => {
        props.auth ??= {
          jwt: {
            authorizer: authorizer.id,
            scopes: [],
          },
        };
      },
    },
  },
});

const authorizer = api.addAuthorizer({
  name: "MyAuthorizer",
  jwt: {
    audiences: [auth.userPoolClient.id],
    issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${auth.userPool.id}`,
  },
});

api.route("GET /public", "packages/functions/src/public.main", {
  auth: false,
});
api.route("GET /private", "packages/functions/src/public.main");
