import { api } from "./api";

export const website = new sst.aws.React("MyWebsite", {
  path: "packages/website/",
  link: [api],
});
