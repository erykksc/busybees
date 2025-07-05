import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Logout() {
  let navigate = useNavigate();
  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);
}
