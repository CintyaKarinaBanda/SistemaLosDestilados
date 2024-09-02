import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import db from '../../database/credentials';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const Gastos = () => {
    const [gastos, setGastos] = useState([]);
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [billId, setBillId] = useState('');
    const [fechaGastoCheck, setfechaGastoCheck] = useState(false);
    const [fechaGasto, setfechaGasto] = useState(new Date().toISOString().slice(0, 10));

    const [mesActual, setMesActual] = useState('');
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        const fechaActual = new Date();
        const mes = fechaActual.toLocaleString('default', { month: 'long' });
        setMesActual(mes.charAt(0).toUpperCase() + mes.slice(1));
    }, []);

    //Funciones de la base de datos
    const fetchData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'bills'));
            const billsList = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(doc => {
                    const fechaGasto = new Date(doc.fechaGasto);
                    const mesEntrada = fechaGasto.toLocaleString('default', { month: 'long' });
                    const anioEntrada = fechaGasto.getFullYear();
                    return mesEntrada.toLowerCase() === mesActual.toLowerCase() && anioEntrada === anioActual;
                });
            console.log(billsList);
            
            setGastos(billsList);
        } catch (error) {
            console.error("Error fetching documents: ", error);
        }
    };
    //Funcion de Inicio
    useEffect(() => {
        if (mesActual) { 
            fetchData();
        }
    }, [mesActual, anioActual]);
    
    

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'bills', id));
            setGastos(gastos.filter(gasto => gasto.id !== id));
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    //Funciones del Modal
    const handleEdit = (gasto = null, editing = false, id = null) => {
        setIsEditing(editing);
        setMonto(gasto.monto);
        setConcepto(gasto.concepto);
        setBillId(id);
    };

    const guardarGatos = async() =>{
        const billData = {
            concepto: concepto,
            monto: monto,
            fechaGasto: fechaGasto,
            fechaGastoCheck: true,
        };

        try {
            if (isEditing) {
                const billRef = doc(db, 'bills', billId);
                await updateDoc(billRef, billData);
                
            } else {
                await addDoc(collection(db, 'bills'), billData);
            }
            fetchData();
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    return (
        <div className="container mb-5">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h1 className="fw-bold">Gastos</h1>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-lg-6 col-md-12 mb-5">
                            <div className="d-flex justify-content-center mb-3">
                                <h4 className="fw-bold text-center">{isEditing ? 'Editar' : 'Agregar'}</h4>
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6 mb-2 mb-md-0">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Concepto"
                                        value={concepto}
                                        onInput={(e) => setConcepto(e.target.value.toUpperCase())}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="col-md-6">
                                    <input
                                        className="form-control"
                                        type="number"
                                        placeholder="Monto"
                                        value={monto}
                                        onInput={(e) => setMonto(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="form-check d-flex align-items-center">
                                    <input type="checkbox" id="fechaGastoCheck" name="fechaGastoCheck" className="form-check-input me-2" checked={fechaGastoCheck} onChange={(e) => setfechaGastoCheck(e.target.checked)} />
                                    <label htmlFor="fechaGastoCheck" className="form-check-label">Fecha de Compra</label>
                                    {fechaGastoCheck && (
                                        <input className="form-control ms-3" type="date" value={fechaGasto} onChange={(e) => setfechaGasto(e.target.value)} />
                                    )}
                                </div>
                            </div>
                            <div className="d-flex mt-4 justify-content-between">
                                <button type="button" className="btn btn-secondary w-50 me-2" onClick={() => { setConcepto(''); setMonto(''); }}>Limpiar</button>
                                <button type="button" className="btn btn-primary w-50 ms-2" onClick={guardarGatos}>{isEditing ? 'Editar Venta' : 'Generar Venta'}</button>
                            </div>
                        </div>

                        <div className='col-lg-6 col-md-12'>
                            <div className="d-flex mb-3">
                                <select
                                    id="mes"
                                    name="mes"
                                    className="form-select me-3"
                                    value={mesActual}
                                    onChange={(e) => setMesActual(e.target.value)}
                                >
                                    {meses.map((mes) => (<option key={mes} value={mes}>{mes}</option>))}
                                </select>
                                <select
                                    id="anio"
                                    name="anio"
                                    className="form-select"
                                    value={anioActual}
                                    onChange={(e) => setAnioActual(e.target.value)}
                                >
                                    {[anioActual, anioActual - 1, anioActual - 2].map((anio) => (<option key={anio} value={anio}>{anio}</option>))}
                                </select>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Concepto</th>
                                            <th>Cantidad</th>
                                            <th>Editar / Borrar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gastos.map((gasto) => (
                                            <tr key={gasto.id}>
                                                <td>{gasto.concepto}</td>
                                                <td>{gasto.monto}</td>
                                                <td>
                                                    <button className="btn btn-secondary me-2" onClick={() => handleEdit(gasto, true, gasto.id)}>
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => handleDelete(gasto.id)}>
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
                </div>
            </div>
        </div>

    );
};

export default Gastos;
