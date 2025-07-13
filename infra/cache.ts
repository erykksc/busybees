export const redis = new sst.aws.Redis("MyRedis", {
  dev: {
    host: "localhost",
    port: 6379,
    username: "default",
    password: "", // No password for local Redis
  },
});
