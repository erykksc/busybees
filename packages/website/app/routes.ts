import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("/logout", "./routes/logout.tsx"),
  route("/auth-callback", "./routes/auth-callback.tsx"),
  route("/auth", "./routes/auth.tsx"),
  route("/calendar", "./routes/calendar.tsx"),
] satisfies RouteConfig;
