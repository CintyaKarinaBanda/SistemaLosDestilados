import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs } from 'firebase/firestore';
import db from '../../database/credentials';

const Graficas = () => {
    const [total, setTotal] = useState(0);
    const [ganancias, setGanancias] = useState(0);
    const [negocio, setNegocio] = useState(0);
    const [sujetos, setSujetos] = useState(0);
    const [costos, setCostos] = useState(0);

    const [gastos, setGastos] = useState(0);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshotGraficas = await getDocs(collection(db, 'sales'));
    
                let total = 0, ganancias = 0, negocio = 0, sujetos = 0, costos = 0, sumaGastos = 0;
    
                querySnapshotGraficas.docs
                    .map(doc => doc.data())
                    .filter(({ fechaCompra }) => {
                        const fecha = new Date(fechaCompra);
                        return (
                            fecha.toLocaleString('default', { month: 'long' }).toLowerCase() === mesActual.toLowerCase() &&
                            fecha.getFullYear() === Number(anioActual)
                        );
                    })
                    .forEach(({ total: saleTotal, productos }) => {
                        total += saleTotal;
                        productos.forEach(({ ganancia, negocio: prodNegocio, sujetos: prodSujetos, costo, cantidad}) => {
                            ganancias += parseFloat(ganancia) * parseFloat(cantidad);
                            negocio += parseFloat(prodNegocio) * parseFloat(cantidad);
                            sujetos += parseFloat(prodSujetos) * parseFloat(cantidad);
                            costos += parseFloat(costo) * parseFloat(cantidad);
                        });
                    });
    
                setTotal(parseFloat(total.toFixed(2)));
                setGanancias(parseFloat(ganancias.toFixed(2)));
                setNegocio(parseFloat(negocio.toFixed(2)));
                setSujetos(parseFloat(sujetos.toFixed(2)));
                setCostos(parseFloat(costos.toFixed(2)));

                const querySnapshotBills = await getDocs(collection(db, 'bills'));
                querySnapshotBills.docs
                    .map(doc => doc.data())
                    .filter(({ fechaGasto }) => {
                        const fecha = new Date(fechaGasto);
                        return (
                            fecha.toLocaleString('default', { month: 'long' }).toLowerCase() === mesActual.toLowerCase() &&
                            fecha.getFullYear() === Number(anioActual)
                        );
                    })
                    .forEach(({ monto }) => {
                        sumaGastos += parseFloat(monto);
                    });
                setGastos(sumaGastos);
    
            } catch (error) {
                console.error("Error fetching documents: ", error);
            }
        };
    
        fetchData();
    }, [mesActual, anioActual]);
    
    return (
        <div className="container mb-5">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h1 className="fw-bold ms-2">Graficas</h1>
                </div>
                <div className="card-body row">
                    <div className="table-responsive col-10">
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Graficas;