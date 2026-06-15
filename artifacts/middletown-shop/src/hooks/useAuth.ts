import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  role: "admin" | "agent" | "user";
  name: string;
  email: string;
  walletBalance: number;
  agentDiscount?: number;
  agentUid?: string;
  createdAt: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("[useAuth] Firestore snapshot error:", error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    },
    (error) => {
      console.error("[useAuth] Auth state error:", error);
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signOut = () => firebaseSignOut(auth);

  return { user, profile, loading, signOut };
}
