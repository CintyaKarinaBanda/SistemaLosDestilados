import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import db from '../../database/credentials';
import { addDoc, updateDoc, collection, doc } from 'firebase/firestore';

const EntradaModal = ({ show, handleClose, product, isEditing }) => {
    const [productName, setProductName] = useState(product?.name || '');
    const [productQR, setProductQR] = useState(product?.qr || '');
    const [provider, setProvider] = useState(product?.provider || 'Fernanda');
    const [date, setDate] = useState(product?.date || new Date().toISOString().slice(0, 10));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setProductName(product.name || '');
            setProductQR(product.qr || '');
            setProvider(product.provider || 'Fernanda');
            setDate(product.date || new Date().toISOString().slice(0, 10));
        } else {
            setProductName('');
            setProductQR('');
            setProvider('Fernanda');
            setDate(new Date().toISOString().slice(0, 10));
        }
    }, [product]);

    const validateFields = () => {
        const newErrors = {};
        if (productName === '') newErrors.productName = 'Required';
        if (productQR === '' ) newErrors.productQR = 'Required';
        if (provider === '') newErrors.provider = 'Required';
        if (date  === '') newErrors.productProfit = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const saveProduct = async () => {
        if (!validateFields()) return;

        const productData = {
            nombre: productName,
            codigoQR: productQR,
            proveedor: provider,
            fechaEntrada: date
        };

        try {
            if (isEditing && product?.id) {
                const productRef = doc(db, 'entries', product.id);
                await updateDoc(productRef, productData);
                handleClose();
            } else {
                await addDoc(collection(db, 'entries'), productData);
                alert('Producto guardado');            
            }
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Edititar Producto' : 'Agregar Producto'}</Modal.Title>
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
                        type="text"
                        className="form-control"
                        id="productQR"
                        value={productQR}
                        placeholder="Código QR"
                        onChange={(e) => setProductQR(e.target.value)}
                        required
                    />
                    {errors.productQR && <div className="text-danger">{errors.productQR}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="provider"
                        value={provider}
                        placeholder="Proveedor"
                        onChange={(e) => setProvider(e.target.value)}
                        required
                    />
                    {errors.provider && <div className="text-danger">{errors.provider}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="date"
                        className="form-control"
                        id="date"
                        value={date}
                        placeholder="Fecyha"
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    {errors.date && <div className="text-danger">{errors.date}</div>}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={saveProduct}>
                    {isEditing ? 'Actualizar' : 'Guardar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EntradaModal;
