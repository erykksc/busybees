import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { AuthProvider, type AuthProviderProps } from "react-oidc-context";

import type { Route } from "./+types/root";
import "./app.css";
import config from "./config";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const cognitoAuthConfig: AuthProviderProps = {
  authority: `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolID}`,
  client_id: config.cognito.clientId,
  redirect_uri: "http://localhost:5173/auth-callback",
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid phone profile",
  onSigninCallback: (user) => {
    const redirectTo = (user?.state as any).redirectAfterSignin;
    if (redirectTo) {
      window.location.href = redirectTo;
    }
    // Otherwise it will be redirected to default location /auth-callback
  },
};

// Then use it in your component
export default function App() {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
