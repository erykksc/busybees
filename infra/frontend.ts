import { api } from "./api";

export const website = new sst.aws.React("ReactFrontend", {
  path: "packages/frontend/",
  link: [api],
});
