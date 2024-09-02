import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import db from '../../database/credentials';
import { addDoc, updateDoc, collection, doc } from 'firebase/firestore';

const ProductoModal = ({ show, handleClose, product, isEditing }) => {
    const [productName, setProductName] = useState(product?.name || '');
    const [productPrice, setProductPrice] = useState(product?.price || '');
    const [productCost, setProductCost] = useState(product?.cost || '');
    const [productProfit, setProductProfit] = useState(product?.profit || '');
    const [businessProfit, setBusinessProfit] = useState('');
    const [subjectProfit, setSubjectProfit] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setProductName(product.name || '');
            setProductCost(product.cost || '');
        } else {
            setProductName('');
            setProductPrice('');
        }
    }, [product]);

    const validateFields = () => {
        const newErrors = {};
        if (productName === '') newErrors.productName = 'Required';
        if (productPrice === '' ) newErrors.productPrice = 'Required';
        if (productCost === '') newErrors.productCost = 'Required';
        if (productProfit  === '') newErrors.productProfit = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    useEffect(() => {
        setBusinessProfit((productProfit * 20.86 / 100).toFixed(2));
        setSubjectProfit((productProfit * 39.56 / 100).toFixed(2));
    }, [productProfit]);

    const saveProduct = async () => {
        if (!validateFields()) return;

        const productData = {
            name: productName,
            price: productPrice,
            cost: productCost,
            profit: productProfit,
            businessProfit: businessProfit,
            subjectProfit: subjectProfit
        };

        try {
            if (isEditing && product?.id) {
                const productRef = doc(db, 'products', product.id);
                await updateDoc(productRef, productData);
            } else {
                await addDoc(collection(db, 'products'), productData);
            }
            handleClose();
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Editar Producto' : 'Agregar Producto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="productName"
                        value={productName}
                        placeholder="Nombre del Destilado"
                        onChange={(e) => setProductName(e.target.value)}
                    />
                    {errors.productName && <div className="text-danger">{errors.productName}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productPrice"
                        value={productPrice}
                        placeholder="Precio a la venta"
                        onChange={(e) => setProductPrice(e.target.value)}
                        required
                    />
                    {errors.productPrice && <div className="text-danger">{errors.productPrice}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productCost"
                        value={productCost}
                        placeholder="Costo"
                        onChange={(e) => setProductCost(e.target.value)}
                        required
                    />
                    {errors.productCost && <div className="text-danger">{errors.productCost}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productProfit"
                        value={productProfit}
                        placeholder="Ganancia"
                        onChange={(e) => setProductProfit(e.target.value)}
                        required
                    />
                    {errors.productProfit && <div className="text-danger">{errors.productProfit}</div>}
                </div>
                <h4 className="mb-2 mt-2">Utilidades</h4>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="businessProfit"
                        value={businessProfit}
                        placeholder="Negocio"
                        onChange={(e) => setBusinessProfit(e.target.value)}
                        required
                    />
                    {errors.businessProfit && <div className="text-danger">{errors.businessProfit}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="subjectProfit"
                        value={subjectProfit}
                        placeholder="Sujetos"
                        onChange={(e) => setSubjectProfit(e.target.value)}
                        required
                    />
                    {errors.subjectProfit && <div className="text-danger">{errors.subjectProfit}</div>}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={saveProduct}>
                    {isEditing ? 'Actualizar' : 'Guardad'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProductoModal;
