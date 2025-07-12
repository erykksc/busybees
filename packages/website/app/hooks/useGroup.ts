import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import type { GroupCalendarDto } from "@busybees/core";

export function useGroup(groupId: string | undefined) {
  const auth = useAuth();
  const [group, setGroup] = useState<GroupCalendarDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user || !groupId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    const fetchGroup = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
          headers: { Authorization: `Bearer ${auth.user!.access_token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch group: ${res.status}`);
        }

        const groupData = (await res.json()).groupProfile as GroupCalendarDto;
        setGroup(groupData);
      } catch (e) {
        console.error("Error fetching group:", e);
        setError("Could not load group data.");
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [auth.user, groupId]);

  return {
    group,
    loading,
    error,
  };
}
