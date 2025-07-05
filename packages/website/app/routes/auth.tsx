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

  const signoutRedirect = () => {
    const clientId = config.cognito.clientId;
    const logoutUri = "<logout uri>";
    const cognitoDomain = config.cognito.domain;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
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

        <button onClick={() => auth.removeUser()}>Sign out</button>
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
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <hr />
      <button onClick={() => signoutRedirect()}>Sign out</button>
      <hr />
      <button onClick={() => callPrivateAPI()}>Call private API</button>
      <hr />
      {privateData}
    </div>
  );
}
