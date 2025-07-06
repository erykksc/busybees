import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import type {Group} from '../types'

export default function Invite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, groups, joinGroup } = useAuth();
  const [checked, setChecked] = useState(false);

useEffect(() => {
  if (!user) {
    navigate(`/register?redirect=/invite/${id}`);
    return;
  }

const storedGroups = localStorage.getItem("groups");
const savedGroups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
  const groupIndex = savedGroups.findIndex((g) => g.id === id);
  if (groupIndex === -1) {
    alert("❌ Invalid or expired invite link!");
    navigate("/dashboard");
    return;
  }

  const group = savedGroups[groupIndex];

  if (!group.members.includes(user.email)) {
    group.members.push(user.email);
    savedGroups[groupIndex] = group;
    localStorage.setItem("groups", JSON.stringify(savedGroups));
    alert(`✅ You joined group "${group.name}"!`);
  } else {
    alert(`ℹ️ You're already in group "${group.name}".`);
  }

  navigate("/dashboard");
}, [user, id, navigate]);



  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold">Joining group...</h2>
    </div>
  );
}
