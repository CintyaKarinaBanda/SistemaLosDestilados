import escposEncoder from 'esc-pos-encoder';
import iconv from 'iconv-lite';  

export async function printTicket(venta) {
    try {
        const printerCharacteristic = await connectToPrinter();

        const imageUrl = '/images/logoX2.png';        

        const ticketContent = createTicketContent(venta);

        const encodedContent = iconv.encode(ticketContent, 'CP850');

        const encoder = new escposEncoder();
        const ticketEncoded = encoder
            .raw(encodedContent)
            .newline() 
            .cut() 
            .encode();


        await sendInChunks(printerCharacteristic, ticketEncoded);

        alert('Ticket enviado a la impresora!');
    } catch (error) {
        console.error('Error en el proceso de impresión:', error);
        alert('Hubo un error al imprimir el ticket.');
    }
}

async function sendInChunks(printerCharacteristic, data) {
    const MAX_SIZE = 512; 
    let offset = 0;

    while (offset < data.length) {
        const chunk = data.slice(offset, offset + MAX_SIZE);
        await printerCharacteristic.writeValue(new Uint8Array(chunk));
        offset += MAX_SIZE;
    }
}


async function connectToPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        });

        if (!device.gatt) throw new Error('El dispositivo no admite GATT.');

        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        
        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const characteristic of characteristics) {
                if (characteristic.properties.write) {
                    return characteristic;
                }
            }
        }
        throw new Error('No se encontró una característica de impresión válida.');
    } catch (connError) {
        console.error('Error al conectar a la impresora:', connError);
        alert('No se pudo conectar a la impresora.');
        throw connError;
    }
}

function createTicketContent({ noNota, nombreCliente, fechaCompra, productos, impuestos, porcentajeImpuestos, dineroImpuestos, envio, montoEnvio, tipoPago, total }) {
    let content = '';

    // Encabezado
    content += 'Los Destilados\nQuerétaro, Querétaro\n\n';
    content += 'Nuestros Licores son disfrute, \nson diversión, son felicidad, \nson sinónimo de celebración\n\n';

    // Detalles de la venta
    content += `Número de Nota: ${noNota}\nCliente: ${nombreCliente}\nFecha de Compra: ${fechaCompra}\n`;
    content += '--------------------------------\n';

    // Productos
    productos.forEach(producto => {
        content += formatProductLine(producto);
    });

    // Impuestos y envío
    if (impuestos) content += `Impuestos ${porcentajeImpuestos}%: ${' '.repeat(10)}$${dineroImpuestos}\n`;
    if (envio) content += `Envío: $${montoEnvio}\n`;
    content += `${tipoPago}\n`;

    // Total
    content += `Total:${' '.repeat(19)}$${total.toFixed(2)}\n`;
    content += '--------------------------------\n';

    return content;
}

function formatProductLine({ nombre, precio, cantidad, descuento, montoDescuento }) {
    const subtotal = precio * cantidad - (montoDescuento || 0);
    return `${nombre} $${subtotal.toFixed(2)}\n  $${precio} x ${cantidad}\n${descuento ? `  - $${montoDescuento} descuento\n` : ''}`;
}
