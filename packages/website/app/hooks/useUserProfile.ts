import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import type { UserProfileDto } from "@busybees/core";

export function useUserProfile() {
  const auth = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${auth.user?.access_token}` },
        });
        
        if (!profileRes.ok) throw new Error("Failed to fetch profile");

        const { userProfile } = (await profileRes.json()) as {
          userProfile: UserProfileDto;
        };

        setUserProfile(userProfile);
      } catch (e) {
        console.error("Error fetching user profile:", e);
        setError("Could not load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [auth.user]);

  return {
    userProfile,
    loading,
    error,
  };
}