import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import db from '../../database/credentials';
import { addDoc, updateDoc, collection, doc } from 'firebase/firestore';

const StockModal = ({ show, handleClose, product, isEditing }) => {    
    const [productName, setProductName] = useState('');
    const [productPiece, setProductPiece] = useState('');
    const [productMililiters, setProductMililiters] = useState('');
    const [productByBox, setProductByBox] = useState('');
    const [productByBottle, setProductByBottle] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setProductName(product.name || '');
            setProductPiece(product.piece || '');
            setProductMililiters(product.milliliters || '');
            setProductByBox(product.byBox || '');
            setProductByBottle(product.byBottle || '');
            setProductCategory(product.category || '');
        } else {
            setProductName('');
            setProductPiece('');
            setProductMililiters('');
            setProductByBox('');
            setProductByBottle('');
            setProductCategory('');
        }
    }, [product]);

    const validateFields = () => {
        const newErrors = {};
        if (productName === '') newErrors.productName = 'Required';
        if (productPiece === '' ) newErrors.productPiece = 'Required';
        if (productMililiters === '') newErrors.productMililiters = 'Required';
        if (productByBox  === '') newErrors.productByBox = 'Required';
        if (productCategory  === '') newErrors.productCategory = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    

    const saveProduct = async () => {
        if (!validateFields()) return;

        const productData = {
            name: productName,
            piece: productPiece,
            mililiters: productMililiters,
            byBox: productByBox,
            byBottle: productByBottle,
            category: productCategory,
        };

        try {
            if (isEditing && product?.id) {
                const productRef = doc(db, 'stock', product.id);
                await updateDoc(productRef, productData);
            } else {
                await addDoc(collection(db, 'stock'), productData);
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
                        id="productPiece"
                        value={productPiece}
                        placeholder="Cantidad de Piezas"
                        onChange={(e) => setProductPiece(e.target.value)}
                        required
                    />
                    {errors.productPiece && <div className="text-danger">{errors.productPiece}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productMililiters"
                        value={productMililiters}
                        placeholder="Militros"
                        onChange={(e) => setProductMililiters(e.target.value)}
                        required
                    />
                    {errors.productMililiters && <div className="text-danger">{errors.productMililiters}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productByBox"
                        value={productByBox}
                        placeholder="Precio por Caja"
                        onChange={(e) => setProductByBox(e.target.value)}
                        required
                    />
                    {errors.productByBox && <div className="text-danger">{errors.productByBox}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        className="form-control"
                        id="productByBottle"
                        value={productByBottle}
                        placeholder="Precio por Botella"
                        onChange={(e) => setProductByBottle(e.target.value)}
                        required
                    />
                    {errors.productByBottle && <div className="text-danger">{errors.productByBottle}</div>}
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="productCategory"
                        value={productCategory}
                        placeholder="Nombre del Destilado"
                        onChange={(e) => setProductCategory(e.target.value)}
                    />
                    {errors.productName && <div className="text-danger">{errors.productName}</div>}
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

export default StockModal;
