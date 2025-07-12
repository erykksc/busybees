import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";
import MyCalendar from "~/components/MyCalendar";

export default authGuard(CalendarPage);

function CalendarPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  return <MyCalendar />;
}
