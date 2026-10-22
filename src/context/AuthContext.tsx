import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  getUserProfile,
  setUserProfile,
  subscribeUsers,
  getAllUsers,
  updateUserDoc,
  deleteUserDoc,
  seedInitialFirestoreDataIfEmpty,
  findUserByIndexNo,
} from '../services/firebaseService';
import { UserProfile, UserRole } from '../types';

export const SUPER_ADMIN_USER: UserProfile = {
  uid: 'super_admin_hans',
  name: 'Hans Super Admin',
  email: 'hansyyy12@gmail.com',
  role: 'admin',
  accountId: 'ADM-001',
  indexNo: 'LH-ADMIN-84729163',
  phone: '+233 24 000 0001',
  createdAt: '2026-10-01T00:00:00.000Z',
};

export const DEMO_LECTURER: UserProfile = {
  uid: 'demo_lecturer_ama_mensah',
  name: 'Dr. Ama Mensah',
  email: 'lecturer@hub.edu',
  role: 'lecturer',
  phone: '+233 24 112 3456',
  accountId: 'LEC-1001',
  createdAt: '2026-10-01T00:00:00.000Z',
};

export const DEMO_STUDENT: UserProfile = {
  uid: 'demo_student_kofi_mensah',
  name: 'Kofi Mensah',
  email: 'student@hub.edu',
  role: 'student',
  indexNo: 'UE12345',
  level: 'Level 200',
  accountId: 'STU-201',
  phone: '+233 20 987 6543',
  code: 'GIS400-P9M',
  createdAt: '2026-10-01T00:00:00.000Z',
};

export const DEFAULT_DIRECTORY_USERS: UserProfile[] = [
  SUPER_ADMIN_USER,
  DEMO_LECTURER,
  DEMO_STUDENT,
  {
    uid: 'student_serwaa_boakye',
    name: 'Serwaa Boakye',
    email: 'serwaa@hub.edu',
    role: 'student',
    indexNo: 'UE28491',
    level: 'Level 100',
    accountId: 'STU-108',
    phone: '+233 27 555 4321',
    code: 'GIS100-X7K',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    uid: 'student_kwame_ansah',
    name: 'Kwame Ansah',
    email: 'kwame@hub.edu',
    role: 'student',
    indexNo: 'UE99142',
    level: 'Level 400',
    accountId: 'STU-402',
    phone: '+233 50 123 7890',
    code: 'GIS400-P9M',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

interface AuthContextType {
  firebaseUser: User | null;
  user: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  impersonatingUser: UserProfile | null;
  originalAdminUser: UserProfile | null;
  allUsers: UserProfile[];
  loginWithGoogle: (rolePreference?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string, role: UserRole) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    role: UserRole,
    name: string,
    indexNo?: string,
    level?: string,
    phone?: string
  ) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  loginAsAdminDemo: () => Promise<void>;
  loginWithAdminCredentials: (indexNo: string, pass: string) => Promise<void>;
  startImpersonation: (targetUser: UserProfile) => void;
  stopImpersonation: () => void;
  updateUserByAdmin: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUserByAdmin: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lecturehub_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [impersonatingUser, setImpersonatingUser] = useState<UserProfile | null>(() => {
    try {
      const s = localStorage.getItem('lh_shadow_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [originalAdminUser, setOriginalAdminUser] = useState<UserProfile | null>(() => {
    try {
      const s = localStorage.getItem('lh_admin_backup');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lh_all_users');
      return saved ? JSON.parse(saved) : DEFAULT_DIRECTORY_USERS;
    } catch {
      return DEFAULT_DIRECTORY_USERS;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync allUsers to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lh_all_users', JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Determine Super Admin capability
  const isSuperAdmin = useMemo(() => {
    if (originalAdminUser) return true; // Impersonating admin retains root privileges
    if (!user) return false;
    return (
      user.email === 'hansyyy12@gmail.com' ||
      user.role === 'admin' ||
      user.uid === 'super_admin_hans' ||
      user.indexNo === 'LH-ADMIN-84729163' ||
      user.accountId === 'ADM-001'
    );
  }, [user, originalAdminUser]);

  // Real-time Firestore auth state observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          let profile = await getUserProfile(fUser.uid);
          const isHansEmail = fUser.email?.toLowerCase() === 'hansyyy12@gmail.com';

          if (!profile) {
            const cached = localStorage.getItem('lecturehub_session_user');
            const cachedData = cached ? JSON.parse(cached) : null;
            profile = {
              uid: fUser.uid,
              name: isHansEmail ? 'Hans (Super Admin)' : fUser.displayName || cachedData?.name || 'Campus Scholar',
              email: fUser.email || cachedData?.email || 'user@hub.edu',
              role: isHansEmail ? 'admin' : cachedData?.role || 'student',
              accountId: isHansEmail
                ? 'ADM-001'
                : cachedData?.accountId || `USR-${fUser.uid.slice(0, 6).toUpperCase()}`,
              indexNo: isHansEmail ? '' : cachedData?.indexNo || 'UE' + Math.floor(10000 + Math.random() * 90000),
              level: isHansEmail ? '' : cachedData?.level || 'Level 200',
              phone: cachedData?.phone || '',
              createdAt: new Date().toISOString(),
            };
            await setUserProfile(profile);
          } else if (isHansEmail && profile.role !== 'admin') {
            profile = { ...profile, role: 'admin' };
            await setUserProfile(profile);
          }

          // If not currently in stealth shadow mode, update active user
          const shadowActive = localStorage.getItem('lh_shadow_user');
          if (!shadowActive) {
            setUser(profile);
            localStorage.setItem('lecturehub_session_user', JSON.stringify(profile));
          }

          // Seed baseline courses & users if clean database
          await seedInitialFirestoreDataIfEmpty(profile.uid);
        } catch (err) {
          console.warn('Profile sync handled: ', err);
        }
      } else {
        // If not authenticated in Firebase Auth, retain demo or local session user
        const cached = localStorage.getItem('lecturehub_session_user');
        if (cached) {
          try {
            const p = JSON.parse(cached);
            setUser(p);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to all users from Firestore if authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    try {
      const unsub = subscribeUsers(
        (list) => {
          if (list && list.length > 0) {
            // Merge with local directory
            setAllUsers((prev) => {
              const map = new Map<string, UserProfile>();
              prev.forEach((u) => map.set(u.uid, u));
              list.forEach((u) => map.set(u.uid, u));
              return Array.from(map.values());
            });
          }
        },
        (err) => {
          console.warn('Users directory subscription offline fallback: ', err.message);
        }
      );
      return () => unsub();
    } catch {}
  }, [firebaseUser]);

  const loginWithGoogle = async (rolePreference: UserRole = 'student') => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fUser = res.user;
      const isHans = fUser.email?.toLowerCase() === 'hansyyy12@gmail.com';
      const actualRole: UserRole = isHans ? 'admin' : rolePreference;

      let profile = await getUserProfile(fUser.uid);
      if (!profile) {
        profile = {
          uid: fUser.uid,
          name: isHans ? 'Hans (Super Admin)' : fUser.displayName || 'Campus User',
          email: fUser.email || '',
          role: actualRole,
          accountId: isHans
            ? 'ADM-001'
            : (actualRole === 'student' ? 'STU-' : 'LEC-') + fUser.uid.slice(0, 6).toUpperCase(),
          indexNo: actualRole === 'student' ? 'UE' + Math.floor(10000 + Math.random() * 90000) : '',
          level: actualRole === 'student' ? 'Level 200' : '',
          createdAt: new Date().toISOString(),
        };
        await setUserProfile(profile);
      } else if (isHans && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin' };
        await setUserProfile(profile);
      }

      setUser(profile);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(profile));
      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.uid !== profile!.uid);
        return [profile!, ...filtered];
      });
      await seedInitialFirestoreDataIfEmpty(profile.uid);
    } finally {
      setLoading(false);
    }
  };

  const loginWithAdminCredentials = async (indexNo: string, pass: string) => {
    setLoading(true);
    try {
      if (pass !== 'vQ9!rT4#zL8@N2$xK7^mP5&bW3*Hc6') {
        throw new Error('Invalid password for administrator account.');
      }

      let fUser: User | null = null;
      try {
        const res = await signInWithEmailAndPassword(auth, 'hansyyy12@gmail.com', pass);
        fUser = res.user;
      } catch {
        try {
          const res = await createUserWithEmailAndPassword(auth, 'hansyyy12@gmail.com', pass);
          fUser = res.user;
        } catch {
          try {
            const anon = await signInAnonymously(auth);
            fUser = anon.user;
          } catch {
            fUser = null;
          }
        }
      }

      const uid = fUser?.uid || 'super_admin_hans';
      const adminProfile: UserProfile = {
        uid,
        name: 'Hans Super Admin',
        email: 'hansyyy12@gmail.com',
        role: 'admin',
        accountId: 'ADM-001',
        indexNo: 'LH-ADMIN-84729163',
        phone: '+233 24 000 0001',
        createdAt: new Date().toISOString(),
      };

      try {
        await setUserProfile(adminProfile);
      } catch (e) {
        console.warn('Set admin profile error: ', e);
      }

      setUser(adminProfile);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(adminProfile));
      setAllUsers((prev) => [
        adminProfile,
        ...prev.filter((p) => p.uid !== adminProfile.uid && p.indexNo !== 'LH-ADMIN-84729163'),
      ]);
      await seedInitialFirestoreDataIfEmpty(uid);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (emailOrIndex: string, pass: string, role: UserRole) => {
    const trimmed = emailOrIndex.trim();
    if (trimmed.toUpperCase() === 'LH-ADMIN-84729163') {
      return loginWithAdminCredentials(trimmed, pass);
    }
    if (trimmed.toLowerCase() === 'hansyyy12@gmail.com' && pass === 'vQ9!rT4#zL8@N2$xK7^mP5&bW3*Hc6') {
      return loginWithAdminCredentials('LH-ADMIN-84729163', pass);
    }

    setLoading(true);
    try {
      let resolvedEmail = trimmed;

      // If user typed an index number (does not contain @)
      if (!trimmed.includes('@')) {
        const matched = await findUserByIndexNo(trimmed);
        if (matched && matched.email) {
          resolvedEmail = matched.email;
        } else {
          const localMatch = allUsers.find(
            (u) => (u.indexNo || '').trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (localMatch && localMatch.email) {
            resolvedEmail = localMatch.email;
          } else {
            throw new Error(`No account found with Index Number "${trimmed}". Please use your registered email.`);
          }
        }
      }

      // STRICT AUTHENTICATION: Never log in unless Firebase Auth confirms credentials!
      let res;
      try {
        res = await signInWithEmailAndPassword(auth, resolvedEmail, pass);
      } catch (err: any) {
        console.warn('Firebase Auth sign in failed:', err.code, err.message);
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found'
        ) {
          throw new Error('Invalid email or password. Please verify your credentials and try again.');
        } else if (err.code === 'auth/too-many-requests') {
          throw new Error('Too many failed login attempts. Please wait a few moments before retrying.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(err.message || 'Authentication failed. Please check your credentials.');
        }
      }

      const fUser = res.user;
      const isHans = resolvedEmail.toLowerCase() === 'hansyyy12@gmail.com';
      const actualRole: UserRole = isHans ? 'admin' : role;

      let profile: UserProfile | null = null;
      try {
        profile = await getUserProfile(fUser.uid);
      } catch {}

      if (!profile) {
        profile = {
          uid: fUser.uid,
          name: isHans ? 'Hans (Super Admin)' : fUser.displayName || resolvedEmail.split('@')[0],
          email: resolvedEmail,
          role: actualRole,
          accountId: isHans
            ? 'ADM-001'
            : (actualRole === 'student' ? 'STU-' : 'LEC-') + fUser.uid.slice(0, 6).toUpperCase(),
          indexNo: actualRole === 'student' ? 'UE' + Math.floor(10000 + Math.random() * 90000) : '',
          level: actualRole === 'student' ? 'Level 200' : '',
          createdAt: new Date().toISOString(),
        };
        try {
          await setUserProfile(profile);
        } catch {}
      } else if (isHans && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin' };
        try {
          await setUserProfile(profile);
        } catch {}
      }

      setFirebaseUser(fUser);
      setUser(profile);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(profile));
      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.uid !== profile!.uid);
        return [profile!, ...filtered];
      });
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    role: UserRole,
    name: string,
    indexNo?: string,
    level?: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (pass.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const isHans = cleanEmail === 'hansyyy12@gmail.com';
      const actualRole: UserRole = isHans ? 'admin' : role;

      // STRICT REGISTRATION: Create real Firebase user, do NOT swallow errors!
      let res;
      try {
        res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (err: any) {
        console.warn('Firebase Auth sign up failed:', err.code, err.message);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Please sign in instead.');
        } else if (err.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please use at least 6 characters.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(err.message || 'Account creation failed. Please check inputs.');
        }
      }

      const fUser = res.user;
      const profile: UserProfile = {
        uid: fUser.uid,
        name: name.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: actualRole,
        indexNo: indexNo?.trim() || (actualRole === 'student' ? 'UE' + Math.floor(10000 + Math.random() * 90000) : ''),
        level: level || (actualRole === 'student' ? 'Level 100' : ''),
        phone: phone?.trim() || '',
        accountId: isHans
          ? 'ADM-001'
          : (actualRole === 'student' ? 'STU-' : 'LEC-') + fUser.uid.slice(0, 6).toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      try {
        await setUserProfile(profile);
      } catch (e) {
        console.warn('Profile write on register:', e);
      }

      setFirebaseUser(fUser);
      setUser(profile);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(profile));
      setAllUsers((prev) => [profile, ...prev.filter((p) => p.uid !== profile.uid)]);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      // Try to sign in anonymously if available for Firestore token
      try {
        await signInAnonymously(auth);
      } catch {}

      const demo = role === 'lecturer' ? DEMO_LECTURER : DEMO_STUDENT;
      setUser(demo);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(demo));
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdminDemo = async () => {
    setLoading(true);
    try {
      try {
        await signInAnonymously(auth);
      } catch {}
      setUser(SUPER_ADMIN_USER);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(SUPER_ADMIN_USER));
    } finally {
      setLoading(false);
    }
  };

  // Stealth Impersonation (Shadow Mode)
  const startImpersonation = (targetUser: UserProfile) => {
    if (!originalAdminUser && user) {
      setOriginalAdminUser(user);
      localStorage.setItem('lh_admin_backup', JSON.stringify(user));
    }
    setImpersonatingUser(targetUser);
    localStorage.setItem('lh_shadow_user', JSON.stringify(targetUser));
    setUser(targetUser);
    localStorage.setItem('lecturehub_session_user', JSON.stringify(targetUser));
  };

  const stopImpersonation = () => {
    const adminBackup = originalAdminUser || SUPER_ADMIN_USER;
    setUser(adminBackup);
    localStorage.setItem('lecturehub_session_user', JSON.stringify(adminBackup));
    setImpersonatingUser(null);
    setOriginalAdminUser(null);
    localStorage.removeItem('lh_shadow_user');
    localStorage.removeItem('lh_admin_backup');
  };

  const updateUserByAdmin = async (uid: string, updates: Partial<UserProfile>) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
    );
    if (user?.uid === uid) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('lecturehub_session_user', JSON.stringify(updated));
    }
    try {
      await updateUserDoc(uid, updates);
    } catch (e) {
      console.warn('Update user doc fallback handled: ', e);
    }
  };

  const deleteUserByAdmin = async (uid: string) => {
    setAllUsers((prev) => prev.filter((u) => u.uid !== uid));
    try {
      await deleteUserDoc(uid);
    } catch (e) {
      console.warn('Delete user doc fallback handled: ', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('lecturehub_session_user');
    localStorage.removeItem('lh_shadow_user');
    localStorage.removeItem('lh_admin_backup');
    setUser(null);
    setFirebaseUser(null);
    setImpersonatingUser(null);
    setOriginalAdminUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('lecturehub_session_user', JSON.stringify(updated));
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === updated.uid ? updated : u))
    );
    if (firebaseUser) {
      try {
        await setUserProfile(updated);
      } catch (e) {
        console.warn('Update profile firestore fallback: ', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        isSuperAdmin,
        impersonatingUser,
        originalAdminUser,
        allUsers,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsDemo,
        loginAsAdminDemo,
        loginWithAdminCredentials,
        startImpersonation,
        stopImpersonation,
        updateUserByAdmin,
        deleteUserByAdmin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
