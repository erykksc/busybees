import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Invite from "./pages/Invite";
import CalendarPage from "./pages/CalendarPage";
import ProfileSettings from "./pages/ProfileSettings";
import CalendarLayout from "./layouts/CalendarLayout";
import { AuthProvider } from "../AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:groupId" element={<Invite />} />

          {/* Protected layout with nested routes */}
          <Route element={<CalendarLayout />}>
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<ProfileSettings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
