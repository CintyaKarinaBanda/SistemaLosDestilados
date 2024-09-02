import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import db from "../../database/credentials";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPrint, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "react-bootstrap";
import PuntoDeVenta from "./PuntoDeVenta";

const InventarioSalida = () => {
    const [ventas, setVentas] = useState([]);
    const [ventasOrigin, setVentasOrigin] = useState([]);

    const [expandedRows, setExpandedRows] = useState({});
    const [show, setShow] = useState(false);
    const [currentSale, setCurrentSale] = useState(null);

    const [mesActual, setMesActual] = useState('');
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());

    const [categoria, setCategoria] = useState('');
    const [valorCategoria, setValorCategoria] = useState('');

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        const fechaActual = new Date();
        const mes = fechaActual.toLocaleString('default', { month: 'long' });
        setMesActual(mes.charAt(0).toUpperCase() + mes.slice(1));
    }, []);

    const handleToggleDetails = (id) => {
        setExpandedRows((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mesActual, anioActual]);

    useEffect(() => {
        if (valorCategoria.trim() === '') {
            setVentas(ventasOrigin);
        } else {
            const ventasFiltradas = ventasOrigin.filter(venta => {
                let isMatch = false;

                if (categoria === 'codigosQR' || categoria === 'nombre') {
                    isMatch = venta.productos.some(producto =>
                        producto[categoria]?.toString().toLowerCase().includes(valorCategoria.toLowerCase())
                    );
                } else {
                    isMatch = venta[categoria]?.toString().toLowerCase().includes(valorCategoria.toLowerCase());
                }

                return isMatch;
            });

            setVentas(ventasFiltradas);
        }
    }, [categoria, valorCategoria, ventasOrigin]);

    const fetchData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'sales'));
            const productsList = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(doc => {
                    const fechaCompra = new Date(doc.fechaCompra);
                    const mesCompra = fechaCompra.toLocaleString('default', { month: 'long' });
                    const anioCompra = fechaCompra.getFullYear();
                    return mesCompra.toLowerCase() === mesActual.toLowerCase() && anioCompra === anioActual;
                })
                .sort((a, b) => b.noNota - a.noNota);
            setVentas(productsList);
            setVentasOrigin(productsList);
        } catch (error) {
            console.error("Error fetching documents: ", error);
        }
    };

    async function handleDelete(ticket) {
        const docRef = doc(db, 'sales', ticket.id);
        try {
            await deleteDoc(docRef);
            const queryNota = await getDocs(collection(db, 'note'));
            const infoNota = queryNota.docs.length > 0
                ? { id: queryNota.docs[0].id, ...queryNota.docs[0].data() }
                : null;
            if (ticket.noNota === (infoNota.num - 1)) updateDoc(doc(db, 'note', 'qarRrDpf4P2jg3r6rYQX'), { num: ticket.noNota });
            fetchData();
        } catch (error) {
            console.error('Error al eliminar el documento:', error);
        }
    }

    function handlePrint() {

    }

    const handleClose = () => {
        setShow(false);
        fetchData();
    };

    return (
        <div className="container mb-5">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h1 className="fw-bold">Inventario Salida</h1>
                </div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-6 col-lg-6 mb-4 mb-md-0 d-flex align-items-center">
                            <select
                                className="form-select me-2"
                                value={mesActual}
                                onChange={(e) => setMesActual(e.target.value)}
                            >
                                {meses.map((mes) => (<option key={mes} value={mes}>{mes}</option>))}
                            </select>

                            <select
                                className="form-select"
                                value={anioActual}
                                onChange={(e) => setAnioActual(e.target.value)}
                            >
                                {[anioActual - 3, anioActual - 2, anioActual - 1, anioActual].map((anio) => (<option key={anio} value={anio}>{anio}</option>))}
                            </select>
                        </div>

                        <div className="col-md-6 col-lg-6 mb-2 mb-md-0 d-flex align-items-center">
                            <select
                                className="form-select me-2"
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                            >
                                <option value=''>Categorias</option>
                                <option value='fechaCompra'>Fecha de Compra</option>
                                <option value='noNota'>Número de Nota</option>
                                <option value='nombreCliente'>Nombre del Cliente</option>
                                <option value='codigosQR'>Código QR</option>
                                <option value='nombre'>Nombre del Producto</option>
                            </select>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="Buscar"
                                value={valorCategoria}
                                onChange={(e) => setValorCategoria(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Número de Nota</th>
                                    <th>Nombre del Cliente</th>
                                    <th>Fecha de Compra</th>
                                    <th>Total de la Compra</th>
                                    <th>Monto Impuestos</th>
                                    <th>Monto Envio</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventas.map((ticket) => (
                                    <React.Fragment key={ticket.id}>
                                        <tr>
                                            <td>{ticket.noNota}</td>
                                            <td>{ticket.nombreCliente}</td>
                                            <td>{ticket.fechaCompra}</td>
                                            <td>$ {ticket.total}</td>
                                            <td>{ticket.impuestos ? '$ ' + ticket.dineroImpuestos : '-'}</td>
                                            <td>{ticket.envio ? '$ ' + ticket.montoEnvio : '-'}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-link"
                                                    onClick={() => handleToggleDetails(ticket.id)}
                                                >Productos</button>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary" onClick={() => {
                                                    setCurrentSale(ticket);
                                                    setShow(true);
                                                }}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <span>  </span>
                                                <button className="btn btn-secondary ml-5" onClick={() => handleDelete(ticket)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                                <span>  </span>
                                                <button className="btn btn-secondary ml-5" onClick={() => handlePrint()}>
                                                    <FontAwesomeIcon icon={faPrint} />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows[ticket.id] && (
                                            <tr>
                                                <td colSpan="8">
                                                    <div className="p-3 bg-light">
                                                        {ticket.productos.map((producto) => (
                                                            <table className="table table-hover">
                                                                <thead>
                                                                    <tr key={producto.id}>
                                                                        <th>Nombre Producto</th>
                                                                        <th>Cantidad</th>
                                                                        <th>Precio</th>
                                                                        <th>Costo</th>
                                                                        <th>Ganancia</th>
                                                                        <th>Negocio</th>
                                                                        <th>Sujetos</th>
                                                                        <th>Monto Descuento</th>
                                                                        <th>Códigos QR</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <td>{producto.nombre}</td>
                                                                    <td>{producto.cantidad}</td>
                                                                    <td>$ {producto.precio}</td>
                                                                    <td>$ {producto.costo}</td>
                                                                    <td>$ {producto.ganancia}</td>
                                                                    <td>$ {producto.negocio}</td>
                                                                    <td>$ {producto.sujetos}</td>
                                                                    <td>{producto.descuento ? '$ ' + producto.montoDescuento : '-'}</td>
                                                                    <td>{producto.codigosQRCheck ? (
                                                                        <ul className="bg-light">
                                                                            {producto.codigosQR.map((codigo, index) => (
                                                                                <li key={index}>{codigo}</li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                    </td>
                                                                </tbody>
                                                            </table>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        <Modal show={show} onHide={handleClose} size="lg">
                            <PuntoDeVenta venta={currentSale} isEditing={true} />
                        </Modal>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventarioSalida;
