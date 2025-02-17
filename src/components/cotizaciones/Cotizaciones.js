import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs } from 'firebase/firestore';
import db from '../../database/credentials';

const Corizaciones = () => {
    const [total, setTotal] = useState(0);
    const [ganancias, setGanancias] = useState(0);
    const [negocio, setNegocio] = useState(0);
    const [sujetos, setSujetos] = useState(0);
    const [costos, setCostos] = useState(0);

    useEffect(() => {
    }, []);

    const fetchData = async () => {
        try {
            const querySnapshotCorizaciones = await getDocs(collection(db, 'contizations'));

            querySnapshotCorizaciones.docs.map(doc => doc.data());

        } catch (error) {
            console.error("Error fetching documents: ", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    return (
        <div className="container mb-5">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h1 className="fw-bold ms-2">Corizaciones</h1>
                </div>
                <div className="card-body row">
                    <div className="table-responsive col-10">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Total</th>
                                    <th scope="col">Productos</th>
                                    <th scope="col">Negocio</th>
                                    <th scope="col">Sujetos</th>
                                    <th scope="col">Costos</th>
                                    <th scope="col">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Aquí se cargan las corizaciones */}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Corizaciones;