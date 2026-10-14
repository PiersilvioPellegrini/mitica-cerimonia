import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../services/firebaseConfig';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Email/Password Login
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Email/Password Register
    function register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // Google Login
    function loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    }

    // Apple Login
    function loginWithApple() {
        return signInWithPopup(auth, appleProvider);
    }

    // Logout
    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Safety timeout in case Firebase is slow/blocked
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const value = {
        currentUser,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
