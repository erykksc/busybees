import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),

  // auth routes
  // TODO: consider moving those paths under /auth
  // route("/signup", "./routes/signup.tsx"), // this one is not needed
  route("/logout", "./routes/logout.tsx"),
  route("/auth-callback", "./routes/auth-callback.tsx"),

  // TODO: check if those routes are necessary
  route("/invite/:groupId", "./routes/invite.tsx"),

  layout("./layouts/CalendarLayout.tsx", [
    route("/my-calendar", "./routes/calendar.tsx"),
    route("/settings", "./routes/settings.tsx"),
    route("/calendar/:groupId", "./routes/group-calendar.tsx"),
  ]),

  // Test routes
  // TODO: eventually remove those routes, when they are no longer necessary
  route("/auth-test", "./routes/auth-test.tsx"),
  route("/calendar-test", "./routes/calendar-test.tsx"),
] satisfies RouteConfig;
