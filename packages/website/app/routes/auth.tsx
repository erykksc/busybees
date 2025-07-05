import { useState } from "react";
import { useAuth } from "react-oidc-context";
import config from "~/config";

export default function Auth() {
  const auth = useAuth();
  const [privateData, setPrivateData] = useState("");

  const callPrivateAPI = async () => {
    const response = await fetch("/api/private", {
      headers: {
        Authorization: `Bearer ${auth?.user?.access_token}`,
      },
    });
    setPrivateData(await response.text());
  };

  const signinRedirect = () => {
    auth.signinRedirect({
      state: {
        redirectAfterSignin: window.location.href,
      },
    });
  };

  const signoutRedirect = () => {
    auth.removeUser();
    auth.signoutRedirect({
      extraQueryParams: {
        client_id: config.cognito.clientId,
        logout_uri: "http://localhost:5173/logout",
      },
    });
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre>

        <button onClick={() => signoutRedirect()}>Sign out</button>
        <hr />
        <button onClick={() => callPrivateAPI()}>Call private API</button>
        <hr />
        {privateData}
      </div>
    );
  }

  return (
    <div>
      {JSON.stringify(config, null, 4)}
      <hr />
      <button onClick={signinRedirect}>Sign in</button>
      <hr /> <button onClick={signoutRedirect}>Sign out</button>
      <hr />
      <button onClick={() => callPrivateAPI()}>Call private API</button>
      <hr />
      {privateData}
    </div>
  );
}
