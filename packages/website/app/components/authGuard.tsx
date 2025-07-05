import { withAuthenticationRequired } from "react-oidc-context";

/**
 * Higher-order component that protects a route by requiring an authenticated user.
 * If the user is not authenticated, they are redirected to the login page.
 * After successful authentication, the user is redirected back to the originally requested page.
 *
 * @param Component - The React component to protect.
 * @returns A React functional component that enforces authentication.
 */
export const authGuard = (Component: React.ComponentType): React.FC => {
  return withAuthenticationRequired(Component, {
    OnRedirecting: () => <div>Redirecting to the login page...</div>,
    signinRedirectArgs: {
      state: {
        redirectAfterSignin: window.location.href,
      },
    },
  });
};
