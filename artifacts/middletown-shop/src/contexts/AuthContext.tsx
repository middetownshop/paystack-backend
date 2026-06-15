import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "user" | "agent" | "admin";
  walletBalance: number;
  profitBalance?: number;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        console.warn("[AuthContext] No profile document found for uid:", uid);
        setProfile(null);
      }
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Safety net: loading can never stay true forever
    const safetyTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[AuthContext] Safety timeout fired — clearing loading state");
        }
        return false;
      });
    }, 8000);

    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        clearTimeout(safetyTimeout);
        setUser(u);
        if (u) {
          await fetchProfile(u.uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        clearTimeout(safetyTimeout);
        console.error("[AuthContext] onAuthStateChanged error:", error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      name,
      phone: phone || "",
      role: "user",
      walletBalance: 0,
      createdAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
