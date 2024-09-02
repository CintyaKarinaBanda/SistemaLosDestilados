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

const isAuthenticated = () => {
    return !!localStorage.getItem('authToken');
};

function App() {
  return (
    <Router>
      <div className='mt-5 mb-8'>.</div>
      <Menu />
      <div className="container mt-5">
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/InventarioSalida" element={isAuthenticated() ? <InventarioSalida /> : <Navigate to="/Login" />} />
          <Route path="/InventarioEntrada" element={isAuthenticated() ? <InventarioEntrada /> : <Navigate to="/Login" />} />
          <Route path="/PuntoDeVenta" element={isAuthenticated() ? <PuntoDeVenta venta={null} isEditing={false} /> : <Navigate to="/Login" />} />
          <Route path="/Productos" element={isAuthenticated() ? <Productos /> : <Navigate to="/Login" />} />
          <Route path="/Corte" element={isAuthenticated() ? <Corte /> : <Navigate to="/Login" />} />
          <Route path="/Gastos" element={isAuthenticated() ? <Gastos /> : <Navigate to="/Login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
