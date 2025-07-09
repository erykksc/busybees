// import { useParams, useNavigate } from "react-router";
// import { authGuard } from "~/components";
// import { useAuth } from "react-oidc-context";
// import { useEffect, useState } from "react";
// import type {Group} from "~/types"

// export default function Invite() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user, groups, joinGroup } = useAuth();
//   const [checked, setChecked] = useState(false);

// useEffect(() => {
//   if (!user) {
//     navigate(`/register?redirect=/invite/${id}`);
//     return;
//   }

// const storedGroups = localStorage.getItem("groups");
// const savedGroups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
//   const groupIndex = savedGroups.findIndex((g) => g.id === id);
//   if (groupIndex === -1) {
//     alert("❌ Invalid or expired invite link!");
//     navigate("/dashboard");
//     return;
//   }

//   const group = savedGroups[groupIndex];

//   if (!group.members.includes(user.email)) {
//     group.members.push(user.email);
//     savedGroups[groupIndex] = group;
//     localStorage.setItem("groups", JSON.stringify(savedGroups));
//     alert(`✅ You joined group "${group.name}"!`);
//   } else {
//     alert(`ℹ️ You're already in group "${group.name}".`);
//   }

//   navigate("/dashboard");
// }, [user, id, navigate]);

// const auth = useAuth();
  
//     if (auth.isLoading) {
//       return <div>Loading...</div>;
//     }

//     const handleAddGoogleCalendar = async () => {
//       try {
//         const response = await fetch(`/api/oauth/google/start`, {
//           headers: {
//             Authorization: `Bearer ${auth.user?.access_token}`,
//           },
//         });
  
//         console.log("Response from OAuth start:", response);
  
//         if (response.ok) {
//           console.log("OAuth flow started successfully");
//           const data = await response.json();
//           if (data.redirectUrl) {
//             window.location.href = data.redirectUrl;
//           } else {
//             console.error("No redirect URL returned from the server");
//           }
//         }
//       } catch (error) {
//         console.error("Error starting OAuth flow:", error);
//       }
//     };

//   return (
//     <div className="p-8 text-center">
//       <h2 className="text-xl font-semibold">Joining group...</h2>
//     </div>
//   );
// }


import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";

function Invite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const joinGroup = async () => {
      if (!auth.user) {
        navigate(`/register?redirect=/invite/${id}`);
        return;
      }

      try {
        const groupRes = await fetch(`/api/groups/${id}/profile`, {
          headers: {
            Authorization: `Bearer ${auth.user.access_token}`,
          },
        });

        if (!groupRes.ok) {
          alert("❌ Invalid or expired invite link.");
          navigate("/");
          return;
        }

        const group = await groupRes.json();

        const userEmail = auth.user?.profile?.email;

        if (!userEmail) {
          alert("User email not found.");
          navigate("/");
          return;
        }

        const isAlreadyMember = group.members.some(
          (member: any) => member.email === userEmail
        );

        if (isAlreadyMember) {
          alert(`ℹ️ You're already in group "${group.name}".`);
        } else {
          const updatedGroup = {
            ...group,
            members: [...group.members, { email: auth.user.profile.email }],
          };

          const updateRes = await fetch(`/api/groups/${id}/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.user.access_token}`,
            },
            body: JSON.stringify(updatedGroup),
          });

          if (!updateRes.ok) {
            throw new Error("Failed to join the group.");
          }

          alert(`✅ You joined group "${group.name}"!`);
        }

        navigate("/calendar");
      } catch (error) {
        console.error("Error joining group:", error);
        alert("❌ Failed to join the group. Please try again later.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      setJoining(true);
      joinGroup();
    }
  }, [auth.user, id, navigate]);

  if (auth.isLoading || loading || joining) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Joining group...</h2>
      </div>
    );
  }

  return null;
}

export default authGuard(Invite);
