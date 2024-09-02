import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { addDoc, collection, deleteField, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import db from "../../database/credentials";

const PuntoDeVenta = ({venta, isEditing}) => {     
    const [noNota, setNoNota] = useState(venta?.noNota || '');

    useEffect(() => {
        const obtenerNoNota = async () => {
            if (noNota === '') {
                try {
                    const queryNota = await getDocs(collection(db, 'note'));
                    const infoNota = { id: queryNota.docs[0].id, ...queryNota.docs[0].data() };

                    if (infoNota.year.toString() === new Date().getFullYear().toString()) {
                        setNoNota(infoNota.num);
                    } else {
                        await updateDoc(doc(db, 'note', 'qarRrDpf4P2jg3r6rYQX'), { num: 1 });
                        setNoNota(1);
                    }
                } catch (err) {
                    console.error("Error al obtener el documento:", err);
                }
            }
        };

        obtenerNoNota();
    }, [noNota]);
    
    const [total, setTotal] = useState(venta?.total || 0);
    const [totalOrigin, setTotalOrigin] = useState(venta? (venta.impuestos===true? (venta.total-venta.dineroImpuestos): venta.total): 0);

    const [nombreCliente, setnombreCliente] = useState(venta?.nombreCliente || '');

    const [impuestos, setImpuestos] = useState(venta?.impuestos || false);
    const [porcentajeImpuestos, setPorcentajeImpuestos] = useState(venta?.porcentajeImpuestos || 16);
    const [dineroImpuestos, setDineroImpuestos] = useState(venta?.dineroImpuestos || 0);

    const [envio, setEnvio] = useState(venta?.envio || false);
    const [montoEnvio, setMontoEnvio] = useState(venta?.montoEnvio || "");
    
    const [proveedorCheck, setProveedorCheck] = useState(venta?.proveedor || false);
    const [proveedor, setProveedor] = useState(venta?.proveedor || "Fernanda");

    const [fechaCompraCheck, setFechaCompraCheck] = useState(venta?.fechaCompraCheck || false);
    const [fechaCompra, setFechaCompra] = useState(venta?.fechaCompra || new Date().toISOString().slice(0, 10));

    const [tipoPago, setTipoPago] = useState(venta?.tipoPago || '');


    const [productosData, setProductosData] = useState([]);

    useEffect(() => {
        if (!envio) {
            setTotal(total - montoEnvio);
            setMontoEnvio("");
        }
        if (!proveedorCheck) setProveedor("Fernanda");
        if (!fechaCompraCheck) setFechaCompra(new Date().toISOString().slice(0, 10));
        if (!impuestos){ 
            setPorcentajeImpuestos(16);
            setDineroImpuestos(0)
            setTotal(totalOrigin);
        } else {
            let newMontoImpuestos = (16 * totalOrigin) / 100;
            setPorcentajeImpuestos(16);
            setTotal(totalOrigin + newMontoImpuestos);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [envio, impuestos, proveedorCheck, fechaCompraCheck]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'products'));
                const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProductosData(productsList);                
            } catch (error) {
                console.error("Error fetching documents: ", error);
            }
        };

        fetchData();
    }, []);

    const [productos, setProductos] = useState(venta?.productos || []);

    const handleAddProducto = () => {
        setProductos([
            ...productos,
            {
                id: Date.now(),
                nombre: "",
                cantidad: "",
                precio: "",
                costo: "",
                ganancia: "",
                negocio: "",
                sujetos: "",
                descuento: false,
                montoDescuento: "",
                codigosQRCheck: false,
                codigosQR: []
            },
        ]);
    };

    const handleRemoveProducto = (id, cantidad, precio, montoDescuento) => {
        const newTotal = total - (parseFloat(precio || 0) * parseFloat(cantidad || 0)) + parseFloat(montoDescuento || 0);
        setTotal(newTotal);
        setProductos(productos.filter((producto) => producto.id !== id));
    };

    const handleInputChange = (id, name, value) => {
        setProductos((prevProductos) =>
            prevProductos.map((producto) => {
                if (producto.id === id) {
                    let updatedProducto = { ...producto };

                    if (name.startsWith("codigosQR[")) {
                        const index = parseInt(name.match(/\d+/)[0], 10);
                        const newCodigosQR = [...producto.codigosQR];
                        newCodigosQR[index] = value;
                        updatedProducto.codigosQR = newCodigosQR;
                    } else {
                        updatedProducto[name] = value;
                    }

                    if (name === "nombre") {
                        const selectedOption = productosData.find(
                            (product) => product.name === value
                        );
                        if (selectedOption) {
                            updatedProducto = {
                                ...updatedProducto,
                                nombre: selectedOption.name,
                                precio: selectedOption.price,
                                costo: selectedOption.cost,
                                ganancia: selectedOption.profit,
                                negocio: selectedOption.businessProfit,
                                sujetos: selectedOption.subjectProfit,
                            };
                        }
                    }

                    if (name === "montoDescuento") {
                        const descuentoActual = parseFloat(value) || 0;
                        const descuentoPrevio = parseFloat(producto.montoDescuento) || 0;
                        updatedProducto.ganancia += descuentoPrevio;
                        updatedProducto.ganancia -= descuentoActual;
                        updatedProducto.negocio = parseFloat(20.86 * updatedProducto.ganancia / 100).toFixed(2); 
                        updatedProducto.sujetos = parseFloat(39.56 * updatedProducto.ganancia / 100).toFixed(2); 
                        updatedProducto.montoDescuento = descuentoActual; 
                    }
        
                    return updatedProducto;
                }
                return producto;
            })
        );        
    
        if (name === "cantidad" || name === "precio" || name === "montoDescuento") {
            const updatedProduct = productos.find((producto) => producto.id === id);
            const cantidad = name === "cantidad" ? value : updatedProduct.cantidad;
            const precio = name === "precio" ? value : updatedProduct.precio;
            const descuento = name === "montoDescuento" ? value : updatedProduct.montoDescuento;
    
            const nuevoTotal = productos.reduce((acc, producto) => {
                const productCantidad = producto.id === id ? cantidad : producto.cantidad;
                const productPrecio = producto.id === id ? precio : producto.precio;
                const productDescuento = producto.id === id ? descuento : producto.montoDescuento;
                return acc + ((productCantidad * productPrecio) - productDescuento);
            }, 0);

            setTotal(nuevoTotal);
            setTotalOrigin(nuevoTotal);
        }
    };

    const generarVenta = async () => {
        const ventaRegistro = {
            noNota: noNota,
            nombreCliente: nombreCliente,
            
            fechaCompra: fechaCompra,
            proveedor: proveedor,
            total: total,
            envio: montoEnvio,
            productos: productos,
            tipoPago: tipoPago,

            fechaCompraCheck: true,
            proveedorCheck: true,
        };
    
        if (impuestos){ 
            ventaRegistro.impuestos = impuestos;
            ventaRegistro.porcentajeImpuestos = porcentajeImpuestos;
            ventaRegistro.dineroImpuestos = dineroImpuestos;
        }
        if (envio){ 
            ventaRegistro.envio = envio;
            ventaRegistro.montoEnvio = montoEnvio;
        }
        
        try {
            if (isEditing && venta?.id) {
                const productSnapshot = await getDoc(doc(db, 'sales', venta.id));
                if (productSnapshot.exists()) {
                    const currentData = productSnapshot.data();

                    const camposParaEliminar = {};
                    Object.keys(currentData).forEach((key) => {
                    if (!(key in ventaRegistro)) {
                        camposParaEliminar[key] = deleteField();
                    }
                    });

                    await updateDoc(doc(db, 'sales', venta.id), {
                    ...ventaRegistro,
                    ...camposParaEliminar,
                    });

                    alert("Venta actualizada exitosamente");
                }
            } else {
                await addDoc(collection(db, 'sales'), ventaRegistro);
                updateDoc(doc(db, 'note', 'qarRrDpf4P2jg3r6rYQX'), { num: parseFloat(noNota) + 1 });
                setNoNota(noNota + 1);
                alert("Venta agregada exitosamente");
            }
        } catch (error) {
            console.error("Error al guardar la venta: ", error);
            alert("Hubo un error al agregar la venta");
        }
    };
    
    return (
        <div className="container mb-5">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h1 className="fw-bold">{isEditing ? 'Editar Venta' : 'Generar Venta'}</h1>
                </div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-6 mb-2 mb-md-0">
                            <input className="form-control" type="text" placeholder="Número de nota" value={noNota} onInput={(e)=>setNoNota(e.target.value.toUpperCase())} required autoFocus />
                        </div>
                        <div className="col-md-6 mb-2 mb-md-0">
                            <input className="form-control" type="text" placeholder="Nombre del Cliente" value={nombreCliente} onInput={(e)=>setnombreCliente(e.target.value.toUpperCase())} required />
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary mb-3 w-100" onClick={handleAddProducto}>Añadir Producto</button>
                    <div id="productos">
                        {productos.map((producto) => (
                            <div key={producto.id} className="inputs-div mb-3">
                                <div className="d-flex mb-3">
                                    <button
                                        onClick={() => handleRemoveProducto(producto.id, producto.cantidad, producto.precio, producto.montoDescuento)}
                                        className="btn btn-danger btn-sm"
                                        style={{ marginRight: "1rem" }} >Eliminar
                                    </button>
                                    <input
                                        type="text"
                                        name="nombre"
                                        list={`productosOpciones-${producto.id}`}
                                        className="form-control"
                                        placeholder="Producto"
                                        value={producto.nombre}
                                        onChange={(e) => handleInputChange(producto.id, "nombre", e.target.value)}
                                    />
                                    <datalist id={`productosOpciones-${producto.id}`}>
                                        {productosData.map((product, index) => (
                                            <option 
                                                key={index} 
                                                value={product.name} 
                                                data-precio={product.price}
                                                data-costo={product.cost}
                                                data-ganancia={product.profit}
                                                data-sujetos={product.businessProfit}
                                                data-negocio={product.subjectProfit}
                                            />
                                        ))}
                                    </datalist>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        className="form-control"
                                        placeholder="Cantidad de botellas"
                                        value={producto.cantidad}
                                        onChange={(e) => handleInputChange(producto.id, "cantidad", e.target.value)}
                                    />
                                </div>
                                <div className="d-flex mb-3">
                                    <input
                                        type="checkbox"
                                        id={`descuento-${producto.id}`}
                                        className="form-check-input"
                                        checked={producto.descuento}
                                        onChange={(e) => handleInputChange(producto.id, "descuento", e.target.checked)}
                                    />
                                    <label htmlFor={`descuento-${producto.id}`} style={{ marginLeft: "5px" }}>
                                        Descuento
                                    </label>
                                    {producto.descuento && (
                                        <input
                                            type="text"
                                            className="form-control"
                                            style={{ marginLeft: "15px" }}
                                            placeholder="Monto del descuento"
                                            value={producto.montoDescuento}
                                            onChange={(e) => handleInputChange(producto.id, "montoDescuento", e.target.value)}
                                        />
                                    )}
                                </div>
                                <div className="d-flex mb-3">
                                    <input
                                        type="text"
                                        name="precio"
                                        className="form-control"
                                        placeholder="Precio"
                                        value={producto.precio}
                                        onChange={(e) => handleInputChange(producto.id, "precio", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        name="costo"
                                        className="form-control"
                                        placeholder="Costo"
                                        value={producto.costo}
                                        onChange={(e) => handleInputChange(producto.id, "costo", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        name="ganancia"
                                        className="form-control"
                                        placeholder="Ganancia"
                                        value={producto.ganancia}
                                        onChange={(e) => handleInputChange(producto.id, "ganancia", e.target.value)}
                                    />
                                </div>
                                <div className="d-flex mb-3">
                                    <input
                                        type="text"
                                        name="sujetoA"
                                        className="form-control"
                                        placeholder="Negocio"
                                        value={producto.negocio}
                                        onChange={(e) => handleInputChange(producto.id, "negocio", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        name="sujetoB"
                                        className="form-control"
                                        placeholder="Sujetos"
                                        value={producto.sujetos}
                                        onChange={(e) => handleInputChange(producto.id, "sujetos", e.target.value)}
                                    />
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        id={`codigosQRCheck-${producto.id}`}
                                        className="form-check-input"
                                        checked={producto.codigosQRCheck}
                                        onChange={(e) => handleInputChange(producto.id, "codigosQRCheck", e.target.checked)}
                                    />
                                    <label htmlFor={`codigosQRCheck-${producto.id}`} className="form-check-label ms-2">Codigos QR</label>
                                    {producto.codigosQRCheck && 
                                        Array.from({ length: producto.cantidad || 1 }, (_, index) => (
                                            <input
                                                key={index} 
                                                type="text"
                                                className="form-control mt-2 d-block"
                                                placeholder="Codigo QR"
                                                value={producto.codigosQR[index] || ""}
                                                onChange={(e) => handleInputChange(producto.id, `codigosQR[${index}]`, e.target.value)}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="pagoEfectivo"
                                    name="tipoPago"
                                    value="efectivo"
                                    className="form-check-input"
                                    checked={tipoPago === 'efectivo'}
                                    onChange={(e) => setTipoPago(e.target.value)}
                                />
                                <label htmlFor="pagoEfectivo" className="form-check-label">Efectivo</label>
                            </div>

                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="pagoTarjeta"
                                    name="tipoPago"
                                    value="tarjeta"
                                    className="form-check-input"
                                    checked={tipoPago === 'tarjeta'}
                                    onChange={(e) => setTipoPago(e.target.value)}
                                />
                                <label htmlFor="pagoTarjeta" className="form-check-label">Tarjeta</label>
                            </div>

                            <div className="form-check">
                                <input
                                    type="radio"
                                    id="pagoTransferencia"
                                    name="tipoPago"
                                    value="transferencia"
                                    className="form-check-input"
                                    checked={tipoPago === 'transferencia'}
                                    onChange={(e) => setTipoPago(e.target.value)}
                                />
                                <label htmlFor="pagoTransferencia" className="form-check-label">Transferencia</label>
                            </div>
                        </div>
                        </div>


                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="form-check d-flex align-items-center">
                                <input type="checkbox" id="envio" name="envio" className="form-check-input me-2" checked={envio} onChange={(e) => setEnvio(e.target.checked)} />
                                <label htmlFor="envio" className="form-check-label">Envio</label>
                                {envio && (
                                    <input
                                    className="form-control ms-3"
                                    type="number"
                                    placeholder="Monto del Envio $"
                                    value={montoEnvio}
                                    onChange={(e) => {
                                      const newMontoEnvio = parseFloat(e.target.value) || 0;
                                      const diferencia = newMontoEnvio - montoEnvio;
                                      setMontoEnvio(newMontoEnvio);
                                      setTotal(total + diferencia);
                                    }}
                                  />
                                )}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-check d-flex align-items-center">
                                <input type="checkbox" id="impuestos" name="impuestos" className="form-check-input me-2" checked={impuestos} onChange={(e) => {setImpuestos(e.target.checked); setDineroImpuestos((porcentajeImpuestos * totalOrigin) / 100);}} />
                                <label htmlFor="impuestos" className="form-check-label">Impuestos</label>
                                {impuestos && (
                                    <div className="d-flex align-items-center ms-3">
                                        <input
                                            className="form-control me-3"
                                            type="number"
                                            placeholder="Monto de Impuestos %"
                                            value={porcentajeImpuestos}
                                            onChange={(e) => {
                                                const newPorcentajeImpuestos = parseFloat(e.target.value) || 0;
                                                const newMontoImpuestos = (newPorcentajeImpuestos * totalOrigin) / 100;
                                                setPorcentajeImpuestos(newPorcentajeImpuestos);
                                                setTotal(totalOrigin + newMontoImpuestos);
                                                setDineroImpuestos(newMontoImpuestos);
                                            }}
                                        />
                                        <p className="mb-0" style={{ fontWeight: 'bold', color: '#333' }}>
                                            Monto: $ {dineroImpuestos.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                         
                            </div>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="form-check d-flex align-items-center">
                                <input type="checkbox" id="proveedorCheck" name="proveedorCheck" className="form-check-input me-2" checked={proveedorCheck} onChange={(e) => setProveedorCheck(e.target.checked)} />
                                <label htmlFor="proveedorCheck" className="form-check-label">Proveedor</label>
                                {proveedorCheck && (
                                    <input className="form-control ms-3" type="text" placeholder="Proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
                                )}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-check d-flex align-items-center">
                                <input type="checkbox" id="fechaCompraCheck" name="fechaCompraCheck" className="form-check-input me-2" checked={fechaCompraCheck} onChange={(e) => setFechaCompraCheck(e.target.checked)} />
                                <label htmlFor="fechaCompraCheck" className="form-check-label">Fecha de Compra</label>
                                {fechaCompraCheck && (
                                    <input className="form-control ms-3" type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
                                )}
                            </div>
                        </div>
                    </div>
                    <h3 className="mb-3">Total: ${total}</h3>
                    <div className="d-flex justify-content-between">
                        <button type="button" className="btn btn-secondary w-25 me-2" onClick={() => {setProductos([]); setTotal(0); setTotalOrigin(0)}}>Limpiar</button>
                        <button type="button" className="btn btn-primary w-75 ms-2" onClick={generarVenta}>{isEditing ? 'Editar Venta' : 'Generar Venta'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PuntoDeVenta;
