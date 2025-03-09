import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import db from '../../database/credentials';
import { addDoc, updateDoc, collection, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const GatosModal = ({ show, handleClose }) => {
    const [concepto, setConcepto] = useState('');
    const [errors, setErrors] = useState({});
    const [conceptos, setConceptos] = useState([]);
    const [editingId, setEditingId] = useState(null); 

    const fetchData = async () => {
        const snapshot = await getDocs(collection(db, 'fixedCosts'));
        setConceptos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const validateForm = () => {
        if (!concepto.trim()) {
            setErrors({ productName: 'El concepto es obligatorio' });
            return false;
        }
        setErrors({});
        return true;
    };

    const saveBill = async (isEditing, id = null) => {
        if (!validateForm()) return; 

        const productData = {
            concepto: concepto
        };

        try {
            if (isEditing && id) {
                const productRef = doc(db, 'fixedCosts', id);
                await updateDoc(productRef, productData);
            } else {
                await addDoc(collection(db, 'fixedCosts'), productData);
            }
            fetchData(); 
            setConcepto(''); 
            setEditingId(null); 
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'fixedCosts', id));
            setConceptos(conceptos.filter(c => c.id !== id)); 
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const handleEdit = (concepto) => {
        setConcepto(concepto.concepto);
        setEditingId(concepto.id); 
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{editingId ? 'Editar Gasto' : 'Alta de Gastos'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <table className="table mb-5">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conceptos.map((concepto) => (
                            <tr key={concepto.id}>
                                <td>{concepto.concepto}</td>
                                <td className="text-center">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleEdit(concepto)}
                                        className="me-2"  // Margen derecho para separar
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDelete(concepto.id)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="productName"
                        value={concepto}
                        placeholder="Concepto"
                        onChange={(e) => setConcepto(e.target.value.toUpperCase())}
                    />
                    {errors.productName && <div className="text-danger">{errors.productName}</div>}
                </div>
                <div className='d-flex justify-content-center'>
                    <Button variant="primary" onClick={() => saveBill(!!editingId, editingId)}>Guardar</Button>
                </div>
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
};

export default GatosModal;
