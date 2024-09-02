import React from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import '../styles/Menu.css'; 
import { useNavigate } from 'react-router-dom';

const Menu = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
      localStorage.removeItem('authToken');
      navigate('/Login');
    };

    return (
        <Navbar className="custom-navbar" expand="lg">
            <Container>
                <Navbar.Brand href="#home">Los Destilados</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <NavDropdown title="Inventarios" id="basic-nav-dropdown">
                            <NavDropdown.Item href="/InventarioEntrada" key="1">Entrada</NavDropdown.Item>
                            <NavDropdown.Item href="/InventarioSalida" key="2">Salida</NavDropdown.Item>
                        </NavDropdown>
                        <Nav.Link href="/PuntoDeVenta">Punto de Venta</Nav.Link>
                        <Nav.Link href="/Gastos">Gastos</Nav.Link>
                        <Nav.Link href="/Corte">Corte</Nav.Link>
                        <Nav.Link href="/">Estadisticas</Nav.Link>
                        <Nav.Link href="/">Cotización</Nav.Link>
                        <Nav.Link href="/Productos">Productos</Nav.Link>
                        <Nav.Link href="/">Stock</Nav.Link>
                    </Nav>
                    <Nav className="ms-auto">
                        <Nav.Link onClick={handleLogout}>Cerrar Sesión</Nav.Link> 
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Menu;
