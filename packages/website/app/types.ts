export interface Group {
  id: string;
  name: string;
  members: string[];
  makeEventsPublic?: boolean;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  showTitles: boolean;
  color: string;
  password: string;
}

export interface CreateEventModalProps {
  show: boolean;
  onClose: () => void;
  eventTitle: string;
  setEventTitle: (title: string) => void;
  eventDate: string;
  eventStart: string;
  setEventStart: (start: string) => void;
  eventEnd: string;
  setEventEnd: (end: string) => void;
  repeatType: string;
  setRepeatType: (repeat: string) => void;
  rangeEndDate: string;
  setRangeEndDate: (date: string) => void;
  onSave: () => void;
}

export interface CreateGroupModalProps {
  newGroupName: string;
  onNameChange: (name: string) => void;
  nameError: string | null;
  isNameValid: boolean;
  makeEventsPublic: boolean;
  toggleMakeEventsPublic: () => void;
  onInviteFriends: () => void;
  onClose: () => void;
}

export type ActiveTab = { type: "personal" } | { type: "group"; group: Group };

export interface CalendarLayoutContext {
  activeTab: ActiveTab;
  user: User;
  makeEventsPublic: boolean;
  setMakeEventsPublic: React.Dispatch<React.SetStateAction<boolean>>;
}

export type OnRemoveGroup = (groupId: string) => void;
