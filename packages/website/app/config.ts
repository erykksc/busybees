export const config = {
  cognito: {
    authority: import.meta.env.VITE_COGNITO_AUTHORITY,
    domain: import.meta.env.VITE_COGNITO_DOMAIN,
    region: import.meta.env.VITE_COGNITO_AWS_REGION,
    userPoolID: import.meta.env.VITE_COGNITO_USERPOOL_ID,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  },
  apiUrl: import.meta.env.VITE_API_URL,
};

export default config;
