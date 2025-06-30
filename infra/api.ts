import db from "./db";

export const apiGateway = new sst.aws.ApiGatewayV2("MyApi", {
  link: [db.eventsTable, db.groupsTable],
  transform: {
    route: {
      args: (props) => {
        props.auth ??= {
          iam: true,
        };
      },
    },
  },
});

apiGateway.route("GET /public", "packages/functions/src/public.main", {
  auth: false,
});
apiGateway.route("GET /private", "packages/functions/src/private.main");
