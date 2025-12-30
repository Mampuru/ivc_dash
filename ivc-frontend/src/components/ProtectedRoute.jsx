import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    //Check current session
    // supabase.auth.getSession().then(({ data }) => {
    //   setSession(data.session);
    //   setLoading(false);
    // });

    // Listen for session changes (login/logout)
    // const { data: listener } = supabase.auth.onAuthStateChange(
    //   (_event, session) => {
    //     setSession(session);
    //   }
    // );

    // return () => {
    //   listener.subscription.unsubscribe();
    // };
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />; // Redirect to AuthForm if not logged in
  }

  return children; //Render Home if authenticated
}
