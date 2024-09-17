import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        // Verificar la autenticación cuando el componente se monte
        const checkAuth = () => {
            setAuth(!!localStorage.getItem('authToken'));
        };
        checkAuth();
    }, []);

    const login = (token) => {
        localStorage.setItem('authToken', token);
        setAuth(true);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuth(false);
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
