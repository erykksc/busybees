import { apiGateway } from "./api";
import auth from "./auth";

export const website = new sst.aws.React("MyWebsite", {
  path: "packages/website/",
  link: [apiGateway, auth.userPoolDomain, auth.userPoolClient],
});
