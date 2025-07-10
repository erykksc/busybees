export async function removeUserFromGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const res = await fetch(`/api/groups/${groupId}/removeUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) throw new Error("Failed to remove user");
  return await res.json();
}
