import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";

export default authGuard(Invite);

function Invite() {
  const { id: inviteCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinGroup = async () => {
      if (!auth.user) {
        navigate(`/register?redirect=/invite/${inviteCode}`);
        return;
      }

      if (!inviteCode) {
        setError("Invalid invite link.");
        return;
      }

      try {
        console.log("Attempting to join group with invite code:", inviteCode);

        // First, try to get the group by invite code
        // Since there's no API endpoint for this, we'll need to create one or work around it
        // For now, let's try a different approach - check if we can join directly
        const joinRes = await fetch(`/api/groups/join/:inviteCode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.user.access_token}`,
          },
          body: JSON.stringify({ inviteCode }),
        });

        if (joinRes.status === 404) {
          // API endpoint doesn't exist, try alternative approach
          // This is a workaround until the proper API is implemented
          setError(
            "Group joining functionality is not fully implemented yet. Please try again later.",
          );
          return;
        }

        if (!joinRes.ok) {
          const errorData = await joinRes.json();
          if (joinRes.status === 409) {
            // Already a member
            setError(`You're already a member of this group.`);
            setTimeout(() => navigate("/"), 2000);
            return;
          }
          throw new Error(errorData.error || "Failed to join group");
        }

        const result = await joinRes.json();
        console.log("Successfully joined group:", result);

        // Show success message and redirect
        setError(`✅ Successfully joined group "${result.groupId}"!`);
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
      joinGroup();
    } else if (!auth.user && !auth.isLoading) {
      navigate(`/register?redirect=/invite/${inviteCode}`);
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
            onClick={() => navigate("/calendar/:groupId")}
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
