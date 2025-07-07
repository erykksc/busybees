export const ensureExampleUserExists = new sst.x.DevCommand(
  "EnsureExampleUserExists",
  {
    dev: {
      autostart: true,
      command: `npm run ensure-user-exists -- --email user@example.com --password Passw0rd!`,
    },
  },
);
