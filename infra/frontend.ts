import { apiGateway } from "./api";
import auth from "./auth";

export const website = new sst.aws.React("MyWebsite", {
  domain:
    $app.stage !== "prod"
      ? undefined
      : {
          name: `busybees.eryk.one`,
          dns: sst.vercel.dns({
            domain: `busybees.eryk.one`,
          }),
        },
  dev: {
    url: "http://localhost:5173",
  },
  path: "packages/website/",
  link: [apiGateway, auth.userPoolDomain, auth.userPoolClient],
  environment: {
    VITE_COGNITO_DOMAIN: auth.userPoolDomainUrl,
    VITE_COGNITO_AWS_REGION: aws.getRegionOutput().name,
    VITE_COGNITO_USERPOOL_ID: auth.userPool.id,
    VITE_COGNITO_CLIENT_ID: auth.userPoolClient.id,
    VITE_API_URL: apiGateway.url,
  },
});
