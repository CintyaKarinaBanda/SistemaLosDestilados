import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import ProductoModal from './ProductoModal';
import db from '../../database/credentials';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const Productos = () => {
  const [show, setShow] = useState(false);
  const [productos, setProductos] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  //Funciones de la base de datos
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(productsList);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
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
  }, []);

  return (
    <div className="container mbz-5">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="fw-bold">Productos</h1>
          <button className="btn btn-primary" onClick={() => handleShow(null, false)}>
            Agregar Producto
          </button>
          <select></select>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Destilado</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Ganancia</th>
                  <th>Editar / Borrar</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.name}</td>
                    <td>{producto.price}</td>
                    <td>{producto.cost}</td>
                    <td>{producto.profit}</td>
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
      <ProductoModal 
        show={show} 
        handleClose={handleClose} 
        product={currentProduct} 
        isEditing={isEditing} 
      />
    </div>
  );
};

export default Productos;
