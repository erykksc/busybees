export const userPool = new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"],
});

export const userPoolClient = userPool.addClient("MyUserPoolClient");

export default { userPool, userPoolClient };
