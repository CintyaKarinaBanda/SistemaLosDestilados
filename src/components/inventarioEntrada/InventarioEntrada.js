import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import EntradaModal from './EntradaModal';
import db from '../../database/credentials';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const InventarioEntrada = () => {
  const [show, setShow] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosOrigin, setProductosOrigin] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesActual, anioActual]);

  useEffect(() => {
    if (valorCategoria.trim() === '') {
      setProductos(productosOrigin);
    } else {
      const ventasFiltradas = productosOrigin.filter(venta =>
        venta[categoria]?.toString().toLowerCase().includes(valorCategoria.toLowerCase())
      );
      setProductos(ventasFiltradas);
    }
  }, [categoria, valorCategoria, productosOrigin]);


  //Funciones de la base de datos
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'entries'));
      const productsList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(doc => {
          const fechaEntrada = new Date(doc.fechaEntrada);
          const mesEntrada = fechaEntrada.toLocaleString('default', { month: 'long' });
          const anioEntrada = fechaEntrada.getFullYear();
          return mesEntrada.toLowerCase() === mesActual.toLowerCase() && anioEntrada === anioActual;
        })
        .sort((a, b) => b.noNota - a.noNota);
      setProductos(productsList);
      setProductosOrigin(productsList);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'entries', id));
      setProductos(productos.filter(product => product.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  //Funciones del Modal
  const handleShow = (product = null, editing = false) => {
    setCurrentProduct(product);
    setIsEditing(editing);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    fetchData();
  };

  //Funcion de Inicio
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mbz-5">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="fw-bold">Entradas</h1>
          <button className="btn btn-primary" onClick={() => handleShow(null, false)}> Agregar Producto </button>
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
                  <th>Destilado</th>
                  <th>Código QR</th>
                  <th>Prooveedor</th>
                  <th>Fecha de Entrada</th>
                  <th>Editar / Borrar</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>{producto.codigoQR}</td>
                    <td>{producto.proveedor}</td>
                    <td>{producto.fechaEntrada}</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => handleShow(producto, true)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <span>  </span>
                      <button className="btn btn-secondary ml-5" onClick={() => handleDelete(producto.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <EntradaModal
        show={show}
        handleClose={handleClose}
        product={currentProduct}
        isEditing={isEditing}
      />
    </div>
  );
};

export default InventarioEntrada;
