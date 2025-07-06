// // hooks/useCreateGroup.js
import { useState } from 'react';

// export default function useCreateGroup(user, setLocalGroups) {
//   const [newGroupName, setNewGroupName] = useState('');
//   const [nameError, setNameError] = useState('');
//   const [isNameValid, setIsNameValid] = useState(false);
//   const [makeEventsPublic, setMakeEventsPublic] = useState(false);

//   const handleNameChange = (value) => {
//     const trimmed = value.trim();
//     setNewGroupName(value);
//     if (trimmed.length === 0) {
//       setIsNameValid(false);
//       setNameError('Please enter a name for your shared calendar');
//     } else {
//       setIsNameValid(true);
//       setNameError('');
//     }
//   };

//   const handleInviteFriends = () => {
//     const trimmed = newGroupName.trim();
//     if (!trimmed) {
//       setIsNameValid(false);
//       setNameError('Please enter a name for your shared calendar');
//       return;
//     }

//     const newGroup = {
//       id: Date.now().toString(),
//       name: trimmed,
//       members: [user.email],
//       makeEventsPublic: makeEventsPublic,
//     };

//     setLocalGroups(prev => [...prev, newGroup]);
//     const savedGroups = JSON.parse(localStorage.getItem("groups")) || [];
//     localStorage.setItem("groups", JSON.stringify([...savedGroups, newGroup]));

//     const inviteLink = `${window.location.origin}/invite/${newGroup.id}`;
//     navigator.clipboard.writeText(inviteLink).then(() => {
//       alert(`Invite link copied: ${inviteLink}`);
//     });

//     setNewGroupName('');
//   };

//   return {
//     newGroupName,
//     nameError,
//     isNameValid,
//     makeEventsPublic,
//     setMakeEventsPublic,
//     handleNameChange,
//     handleInviteFriends
//   };
// }


// useCreateGroup.js
import { Dispatch, SetStateAction } from 'react';
import { User } from '../types'; 
import { Group } from '../types';

export default function useCreateGroup(
  user: User,
  localGroups: Group[],
  setLocalGroups: Dispatch<SetStateAction<Group[]>>
) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  const [makeEventsPublic, setMakeEventsPublic] = useState(false);

  const handleCreateGroup = () => {
    if (!name.trim()) {
      setNameError('Name is required.');
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name,
      public: makeEventsPublic,
      members: [user.email],
    };

    const updatedGroups = [...localGroups, newGroup];
    setLocalGroups(updatedGroups);
    localStorage.setItem('groups', JSON.stringify(updatedGroups));
    // ✅ Do NOT toggle modal state here! Let parent do that.
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