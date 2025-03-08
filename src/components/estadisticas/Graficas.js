import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs } from "firebase/firestore";
import db from "../../database/credentials";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Graficas = () => {
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [anioActualTablas, setAnioActualTablas] = useState(new Date().getFullYear());
  const [valor, setValor] = useState("ganancia");
  const [valorAnual, setValorAnual] = useState("ganancia");
  const [datos, setDatos] = useState([]);

  const [ventas, setVentas] = useState([]);
  const [ventasAnuales, setVentasAnuales] = useState([]);
  const [clientesPorMes, setClientesPorMes] = useState({});
  const [productosPorMes, setProductosPorMes] = useState({});
  const [tablaSeleccionada, setTablaSeleccionada] = useState('clientes');

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        setDatos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchData();
  }, []);

  const processSalesData = (year, valor) => {
    const totalPorMes = datos.reduce((acc, doc) => {
      if (new Date(doc.fechaCompra).getFullYear() !== year) return acc;

      doc.productos.forEach((producto) => {
        const totalVenta = parseFloat(producto[valor]);
        if (isNaN(totalVenta)) return;

        const mes = new Date(doc.fechaCompra).getMonth();
        acc[mes] = (acc[mes] || 0) + totalVenta;
      });
      return acc;
    }, {});

    return meses.map((mes, index) => ({
      mes,
      total: totalPorMes[index] || 0,
    }));
  };

  useEffect(() => {
    setVentas(processSalesData(anioActual, valor));
  }, [datos, anioActual, valor]);

  useEffect(() => {
    const totalPorAnio = datos.reduce((acc, doc) => {
      doc.productos.forEach((producto) => {
        const totalVenta = parseFloat(producto[valorAnual]);
        if (isNaN(totalVenta)) return;

        const anio = new Date(doc.fechaCompra).getFullYear();
        acc[anio] = (acc[anio] || 0) + totalVenta;
      });
      return acc;
    }, {});

    setVentasAnuales(Object.keys(totalPorAnio).map((anio) => ({
      anio: Number(anio),
      total: totalPorAnio[anio],
    })));
  }, [datos, valorAnual]);

  const updateTablas = () => {
    const clientesData = {};
    const productosData = {};
  
    datos.forEach((venta) => {
      const fechaCompra = new Date(venta.fechaCompra);
      const mes = fechaCompra.getMonth();
      const anio = fechaCompra.getFullYear();
      const nombreCliente = venta.nombreCliente;
      const productos = venta.productos;
  
      if (nombreCliente === "NA" || anio !== anioActualTablas) return;
  
      // Actualizar datos de clientes
      if (!clientesData[nombreCliente]) clientesData[nombreCliente] = {};
      clientesData[nombreCliente][meses[mes]] = (clientesData[nombreCliente][meses[mes]] || 0) + 1;
  
      // Actualizar datos de productos
      productos.forEach((producto) => {
        if (!productosData[producto.nombre]) {
          productosData[producto.nombre] = {};
        }
        productosData[producto.nombre][meses[mes]] = (productosData[producto.nombre][meses[mes]] || 0) + 1;
      });
    });
  
    setClientesPorMes(clientesData);
    setProductosPorMes(productosData);
  };  

  useEffect(() => {
    updateTablas();
  }, [datos, anioActualTablas]);

  const chartDataMensual = {
    labels: meses,
    datasets: [{
      label: "Corte mensual",
      data: ventas.map((venta) => venta.total),
      fill: false,
      borderColor: "rgba(75,192,192,1)",
      tension: 0.1,
    }],
  };

  const chartDataAnual = {
    labels: ventasAnuales.map((venta) => venta.anio),
    datasets: [{
      label: "Corte anual",
      data: ventasAnuales.map((venta) => venta.total),
      fill: false,
      borderColor: "rgba(255,99,132,1)",
      tension: 0.1,
    }],
  };

  return (
    <>
      <div className="container mb-5">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h1 className="fw-bold ms-2">Gráficas</h1>
          </div>
          <div className="card-body row">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2">
                <select className="form-select" value={anioActual} onChange={(e) => setAnioActual(Number(e.target.value))}>
                  {[new Date().getFullYear() - 3, new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()].map((anio) => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
                <select className="form-select" value={valor} onChange={(e) => setValor(e.target.value)}>
                  <option value="ganancia">Ganancias</option>
                  <option value="negocio">Negocio</option>
                  <option value="sujetos">Sujetos</option>
                  <option value="costo">Costos</option>
                  <option value="precio">Gastos</option>
                </select>
              </div>
              <div style={{ height: "250px" }}>
                <Line data={chartDataMensual} options={{ responsive: true }} />
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2">
                <select className="form-select" value={valorAnual} onChange={(e) => setValorAnual(e.target.value)}>
                  <option value="ganancia">Ganancias</option>
                  <option value="negocio">Negocio</option>
                  <option value="sujetos">Sujetos</option>
                  <option value="costo">Costos</option>
                  <option value="precio">Gastos</option>
                </select>
              </div>
              <div style={{ height: "250px" }}>
                <Line data={chartDataAnual} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mb-5">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h1 className="fw-bold ms-2">Recuento</h1>
          </div>
          <div className="card-body row">
            <div className="mb-3 col-12 col-md-3">
              <label htmlFor="anioSelect" className="form-label">Selecciona el año</label>
              <select id="anioSelect" className="form-select" value={anioActualTablas} onChange={(e) => setAnioActualTablas(Number(e.target.value))}>
                {[new Date().getFullYear() - 1, new Date().getFullYear()].map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <button className={`btn ${tablaSeleccionada === 'clientes' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTablaSeleccionada('clientes')}>
                Recuento por Cliente
              </button>
              <button className={`btn ${tablaSeleccionada === 'productos' ? 'btn-primary' : 'btn-outline-primary'} ms-2`} onClick={() => setTablaSeleccionada('productos')}>
                Recuento por Producto
              </button>
            </div>

            {tablaSeleccionada === 'clientes' && (
              <div className="table-responsive mt-4">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th scope="col">Cliente</th>
                      {meses.map((mes) => <th key={mes} scope="col">{mes}</th>)}
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(clientesPorMes).map(([cliente, comprasPorMes]) => (
                      <tr key={cliente}>
                        <td>{cliente}</td>
                        {meses.map((mes) => {
                          const cantidad = comprasPorMes[mes] || 0;
                          return <td key={mes}>{cantidad === 0 ? '-' : cantidad}</td>;
                        })}
                        <td>{Object.values(comprasPorMes).reduce((acc, val) => acc + val, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tablaSeleccionada === 'productos' && (
              <div className="table-responsive mt-4">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      {meses.map((mes) => <th key={mes} scope="col">{mes}</th>)}
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(productosPorMes).map(([producto, comprasPorMes]) => (
                      <tr key={producto}>
                        <td>{producto}</td>
                        {meses.map((mes) => {
                          const cantidad = comprasPorMes[mes] || 0; // Accede al valor de cada mes
                          return <td key={mes}>{cantidad === 0 ? '-' : cantidad}</td>; // Muestra el valor o "-" si es 0
                        })}
                        <td>{Object.values(comprasPorMes).reduce((acc, val) => acc + val, 0)}</td> {/* Total */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Graficas;
