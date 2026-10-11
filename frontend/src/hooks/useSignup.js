import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();
  const navigate = useNavigate();

  const signup = async ({ userName, password, email, fullName }) => {
    const success = handleInputErrors({ userName, password, email });
    if (!success) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName: userName.trim(),
          password,
          email: email.trim(),
          fullName: fullName ? fullName.trim() : userName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to register account");
      }

      localStorage.setItem("user", JSON.stringify(data));
      setAuthUser(data);
      toast.success("Account registered successfully!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { loading, signup };
};

export default useSignup;

const handleInputErrors = ({ userName, password, email }) => {
  if (!userName || !password || !email) {
    toast.error("Please fill in all required fields");
    return false;
  }

  if (password.length < 6) {
    toast.error("Password must be at least 6 characters long");
    return false;
  }

  return true;
};