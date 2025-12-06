import { useState, useEffect } from "react";
import { loginWithGoogle, logout, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// 🧩 Import your styled Button component
import { Button } from "@/components/ui/button";

// 🎨 (Optional) lucide-react icons for visual enhancement
import { LogIn, LogOut } from "lucide-react";

function Login({ onLogin }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) onLogin(currentUser);
    });
    return () => unsubscribe();
  }, [onLogin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">CampusConnect Login</h1>

      {!user ? (
        <Button
          variant="login" // 💙 Gradient login button from your button.tsx
          onClick={loginWithGoogle}
          className="px-6 py-3 text-lg"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </Button>
      ) : (
        <div className="text-center">
          <p className="mb-4">Welcome, {user.displayName}</p>

          <Button
            variant="report" // ❤️ Red-orange gradient for logout
            onClick={logout}
            className="px-5 py-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}

export default Login;
