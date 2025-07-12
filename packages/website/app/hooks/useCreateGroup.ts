import type { GroupCalendarDto, UserProfileDto } from "@busybees/core";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAuth } from "react-oidc-context";

export default function useCreateGroup(
  user: UserProfileDto,
  localGroups: GroupCalendarDto[],
  setLocalGroups: Dispatch<SetStateAction<GroupCalendarDto[]>>,
) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isNameValid, setIsNameValid] = useState(false);
  const [makeEventsPublic, setMakeEventsPublic] = useState(false);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }

    const auth = useAuth();

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user?.access_token}`,
        },
        body: JSON.stringify({
          groupId: name,
          makeEventsPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const newGroup = (await response.json())
        ?.groupCalendar as GroupCalendarDto;

      const updatedGroups = [...localGroups, newGroup];
      setLocalGroups(updatedGroups);
      localStorage.setItem("groups", JSON.stringify(updatedGroups));
    } catch (error) {
      console.error("Error creating group:", error);
      setNameError("Failed to create group. Try again.");
    }
  };

  return {
    name,
    setName,
    nameError,
    isNameValid,
    makeEventsPublic,
    setMakeEventsPublic,
    handleCreateGroup,
  };
}
