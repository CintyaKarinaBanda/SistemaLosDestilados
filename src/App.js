import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import InventarioEntrada from './components/inventarioEntrada/InventarioEntrada';
import InventarioSalida from './components/inventarioSalida/InventarioSalida';
import PuntoDeVenta from './components/inventarioSalida/PuntoDeVenta';
import Productos from './components/productos/Productos';
import Menu from './components/Menu';
import './styles/App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import Corte from './components/corte/Corte';
import Login from './components/Login'; 
import Gastos from './components/gastos/Gastos';
import { useAuth, AuthProvider } from './components/AuthContext';

function App() {
    const { auth } = useAuth();

    if (auth === null) {
        // Mientras estamos verificando la autenticación, podrías mostrar un loader o nada
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div className='mt-5 mb-8'>.</div>
            <Menu />
            <div className="container mt-5">
                <Routes>
                    <Route path="/Login" element={<Login />} />
                    <Route path="/InventarioSalida" element={auth ? <InventarioSalida /> : <Navigate to="/Login" />} />
                    <Route path="/InventarioEntrada" element={auth ? <InventarioEntrada /> : <Navigate to="/Login" />} />
                    <Route path="/PuntoDeVenta" element={auth ? <PuntoDeVenta venta={null} isEditing={false} /> : <Navigate to="/Login" />} />
                    <Route path="/Productos" element={auth ? <Productos /> : <Navigate to="/Login" />} />
                    <Route path="/Corte" element={auth ? <Corte /> : <Navigate to="/Login" />} />
                    <Route path="/Gastos" element={auth ? <Gastos /> : <Navigate to="/Login" />} />
                </Routes>
            </div>
        </Router>
    );
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);
