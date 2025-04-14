import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import db from '../../database/credentials';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

const EntradaModal = ({ show, handleClose, product, isEditing }) => {
    const initialState = {
        productName: '',
        date: new Date().toLocaleDateString('en-CA'),
        dateCheck: false,
        cantidad: '',
        provider: 'Fernanda',
        monto: '',
    };

    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setForm({
                productName: product.nombre || '',
                date: product.fechaIngreso || new Date().toLocaleDateString('en-CA'),
                dateCheck: !!product.fechaIngreso,
                cantidad: product.cantidad || '',
                provider: product.proveedor || 'Fernanda',
                monto: product.monto || '',
            });
        } else {
            setForm(initialState);
        }
    }, [product]);

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateFields = () => {
        const newErrors = {};
        if (!form.productName) newErrors.productName = 'Requerido';
        if (!form.cantidad) newErrors.cantidad = 'Requerido';
        if (!form.provider) newErrors.provider = 'Requerido';
        if (!form.monto) newErrors.monto = 'Requerido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveProduct = async () => {
        if (!validateFields()) return;

        const productData = {
            nombre: form.productName,
            cantidad: parseInt(form.cantidad),
            proveedor: form.provider,
            monto: parseFloat(form.monto),
            fechaIngreso: form.date,
        };

        try {
            if (isEditing && product?.id) {
                const productRef = doc(db, 'entries', product.id);
                await updateDoc(productRef, productData);
            } else {
                await addDoc(collection(db, 'entries'), productData);
                alert('Producto guardado');
            }
            handleClose();
        } catch (error) {
            console.error('Error saving document:', error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Editar Producto' : 'Agregar Producto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {[
                    { id: 'productName', placeholder: 'Nombre del Destilado', value: form.productName, type: 'text' },
                    { id: 'cantidad', placeholder: 'Cantidad de Caja', value: form.cantidad, type: 'text' },
                    { id: 'provider', placeholder: 'Proveedor', value: form.provider, type: 'text' },
                    { id: 'monto', placeholder: 'Monto de Inversión', value: form.monto, type: 'number' },
                ].map(({ id, placeholder, value, type }) => (
                    <div className="mb-3" key={id}>
                        <input
                            type={type}
                            className="form-control"
                            id={id}
                            value={value}
                            placeholder={placeholder}
                            onChange={handleChange(id)}
                        />
                        {errors[id] && <div className="text-danger">{errors[id]}</div>}
                    </div>
                ))}
                <div className="col-md-6">
                    <div className="form-check d-flex align-items-center">
                        <input
                            type="checkbox"
                            id="fechaCompraCheck"
                            className="form-check-input me-2"
                            checked={form.dateCheck}
                            onChange={handleChange('dateCheck')}
                        />
                        <label htmlFor="fechaCompraCheck" className="form-check-label">Fecha de Compra</label>
                        {form.dateCheck && (
                            <input
                                className="form-control ms-3"
                                type="date"
                                value={form.date}
                                onChange={handleChange('date')}
                            />
                        )}
                    </div>
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
