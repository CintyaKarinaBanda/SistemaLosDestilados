import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import StockModal from "./StockModal";
import db from "../../database/credentials";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { handleDownload } from "./handleDownland";

const Stock = () => {
  const [show, setShow] = useState(false);
  const [productos, setStock] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Cargar datos desde Firebase
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "stock"));
      const productsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      productsList.sort((a, b) => a.name.localeCompare(b.name));
      setStock(productsList);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "stock", id));
      setStock(productos.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal Handlers
  const handleShow = (product = null, editing = false) => {
    setCurrentProduct(product);
    setIsEditing(editing);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    fetchData();
  };

  return (
    <div className="container mbz-5">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="fw-bold mb-0">Stock por Caja</h1>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => handleShow(null, false)}
            >
              Agregar Producto
            </button>
            <button className="btn btn-primary" onClick={() => handleDownload(productos)}>
              Descargar
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table id="product-table" className="table table-hover">
              <thead>
                <tr>
                  <th>Destilado</th>
                  <th className="text-center">Piezas</th>
                  <th className="text-center">Mililitros</th>
                  <th className="text-center">Precio x Caja</th>
                  <th className="text-center">Precio x Botella</th>
                  <th className="text-center">Categoria</th>
                  <th>Editar / Borrar</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.name}</td>
                    <td className="text-center">{producto.piece}</td>
                    <td className="text-center">{producto.mililiters}</td>
                    <td className="text-center">{producto.byBox}</td>
                    <td className="text-center">{producto.byBottle}</td>
                    <td className="text-center">{producto.category}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleShow(producto, true)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <span> </span>
                      <button
                        className="btn btn-secondary ml-5"
                        onClick={() => handleDelete(producto.id)}
                      >
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

      <StockModal
        show={show}
        handleClose={handleClose}
        product={currentProduct}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Stock;
