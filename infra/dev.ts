new sst.x.DevCommand("CreateExampleUser", {
  dev: {
    autostart: true,
    command: `npm run admin-create-user -- --email user@example.com --password Passw0rd!`,
  },
});
