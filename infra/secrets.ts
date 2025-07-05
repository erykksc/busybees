export const googleClientId = new sst.Secret("GoogleClientId");
export const googleClientSecret = new sst.Secret("GoogleClientSecret");
export const googleRedirectUri = new sst.Secret("GoogleRedirectUri");

export default {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
};
