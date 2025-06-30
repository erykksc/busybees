import { apiGateway } from "./api";
import auth from "./auth";

const region = aws.getRegionOutput().name;
export const website = new sst.aws.React("MyWebsite", {
  path: "packages/website/",
  link: [apiGateway, auth.userPoolDomain, auth.userPoolClient],
  environment: {
    VITE_COGNITO_AUTHORITY: $interpolate`https://cognito-idp.${region}.amazonaws.com/${auth.userPool.id}`,
    VITE_COGNITO_DOMAIN: auth.userPoolDomainUrl,
    VITE_COGNITO_AWS_REGION: region,
    VITE_COGNITO_USERPOOL_ID: auth.userPool.id,
    VITE_COGNITO_CLIENT_ID: auth.userPoolClient.id,
    VITE_API_URL: apiGateway.url,
  },
});
