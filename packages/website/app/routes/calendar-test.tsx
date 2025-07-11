import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";

export default authGuard(Calendar);

function Calendar() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  const handleAddGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/oauth/google/start`, {
        headers: {
          Authorization: `Bearer ${auth.user?.access_token}`,
        },
      });

      console.log("Response from OAuth start:", response);

      if (response.ok) {
        console.log("OAuth flow started successfully");
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          console.error("No redirect URL returned from the server");
        }
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
    }
  };

  return (
    <div>
      <h1>Calendar Integration</h1>
      <hr />
      <p>Connect your Google Calendar to sync your events</p>
      <hr />
      <button className="bg-blue-500 " onClick={handleAddGoogleCalendar}>
        Add Google Calendar
      </button>
    </div>
  );
}
