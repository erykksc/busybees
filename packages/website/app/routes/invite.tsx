import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";

export default authGuard(Invite);

function Invite() {
  const { groupId: inviteCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useEffect triggered:", {
      inviteCode,
      authUser: !!auth.user,
      authIsLoading: auth.isLoading,
    });

    const joinGroup = async () => {
      console.log("joinGroup function called");

      if (!auth.user) {
        console.log("No auth user, redirecting to register");
        navigate(`/register?redirect=/invite/${inviteCode}`);
        return;
      }

      if (!inviteCode) {
        console.log("No invite code found");
        setError("Invalid invite link.");
        setLoading(false);
        return;
      }

      try {
        console.log("Attempting to join group with invite code:", inviteCode);

        const joinRes = await fetch(`/api/groups/join/${inviteCode}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.user.access_token}`,
          },
        });

        if (joinRes.status === 404) {
          setError("Invalid invite code. The group could not be found.");
          return;
        }

        if (joinRes.status === 302) {
          const location = joinRes.headers.get("Location");
          if (location) {
            setError(`✅ Successfully joined group!`);
            setTimeout(() => navigate(location), 2000);
            return;
          }
        }

        if (!joinRes.ok) {
          const errorData = await joinRes.json();
          if (joinRes.status === 409) {
            setError(`You're already a member of this group.`);
            setTimeout(() => navigate("/"), 2000);
            return;
          }
          throw new Error(errorData.error || "Failed to join group");
        }

        setError(`✅ Successfully joined group!`);
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        console.error("Error joining group:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to join the group. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (inviteCode && auth.user) {
      console.log("Calling joinGroup function");
      joinGroup();
    } else if (!auth.user && !auth.isLoading) {
      console.log("No user and not loading, redirecting to register");
      navigate(`/register?redirect=/invite/${inviteCode}`);
    } else {
      console.log("Conditions not met for API call:", {
        hasInviteCode: !!inviteCode,
        hasUser: !!auth.user,
        isLoading: auth.isLoading,
      });
      setLoading(false);
    }
  }, [auth.user, auth.isLoading, inviteCode, navigate]);

  if (auth.isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Joining group...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we process your invite.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">
            {error.includes("✅") ? "🎉" : "❌"}
          </div>
          <h2 className="text-xl font-semibold mb-4">
            {error.includes("✅") ? "Welcome!" : "Oops!"}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Calendar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
