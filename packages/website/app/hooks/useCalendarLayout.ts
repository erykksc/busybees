import { useState } from "react";

export function useCalendarLayout() {
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return {
    toast,
    setToast,
    burgerOpen,
    setBurgerOpen,
    showCreateGroup,
    setShowCreateGroup,
  };
}
