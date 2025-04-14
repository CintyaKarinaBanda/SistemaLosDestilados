import { createCanvas, loadImage } from 'canvas';
import iconv from 'iconv-lite';

// CONFIGURACIÓN DE LA IMPRESORA
const PRINTER_SETTINGS = {
    maxLineLength: 32,
    boldOn: '\x1b\x45\x01',
    boldOff: '\x1b\x45\x00',
    encoding: 'CP850',
    maxImageWidth: 256,
    maxImageHeight: 256,
    serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
};

// UTILIDADES DE TEXTO
const centerText = (text) => {
    const spaces = Math.max(0, PRINTER_SETTINGS.maxLineLength - text.length);
    return ' '.repeat(Math.floor(spaces / 2)) + text;
};

const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00Z');
    return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
};

function formatProductLine({ nombre, precio, cantidad, descuento, montoDescuento }) {
    const subtotal = precio * cantidad - (montoDescuento || 0);
    const detalle = `$${precio} x ${cantidad}${descuento ? ` - $${montoDescuento}` : ''}`;
    const subtotalStr = `$${subtotal.toFixed(2)}`;
    const spaces = Math.max(0, PRINTER_SETTINGS.maxLineLength - detalle.length - subtotalStr.length - 2);
    return `${nombre}\n  ${detalle}${' '.repeat(spaces)}${subtotalStr}`;
}

// CREAR TICKET
function createTicketContent({ noNota, nombreCliente, fechaCompra, productos, impuestos, porcentajeImpuestos, dineroImpuestos, envio, montoEnvio, tipoPago, total }) {
    const boldOn = PRINTER_SETTINGS.boldOn;
    const boldOff = PRINTER_SETTINGS.boldOff;

    return [
        boldOn + centerText('Los Destilados') + boldOff,
        centerText('Querétaro, Querétaro'),
        ...'Nuestros Licores son disfrute,\nson diversión, son felicidad,\nson sinónimo de celebración'
            .split('\n').map(centerText),
        '',
        `Número de Nota: ${noNota}`,
        `Cliente: ${nombreCliente}`,
        `Fecha de Compra: ${formatearFecha(fechaCompra)}`,
        '--------------------------------',
        ...productos.map(formatProductLine),
        impuestos ? `Impuestos ${porcentajeImpuestos}%: $${dineroImpuestos}` : '',
        envio ? `Envío: $${montoEnvio}` : '',
        boldOn + `Total:${' '.repeat(17)}$${total.toFixed(2)}` + boldOff,
        tipoPago,
        '--------------------------------',
        ...'Se admiten cambios y\ndevoluciones en mercancía en\n30 días con la nota.\n\nInstagram: @losdestiladosqro\n\nWhatsApp: 4461283277\n¡Gracias por su compra!'
            .split('\n').map(centerText)
    ].filter(Boolean).join('\n');
}

// CARGAR Y CONVERTIR IMAGEN
async function loadAndConvertImage(imageUrl) {
    const img = await loadImage(imageUrl);
    const aspectRatio = img.width / img.height;
    let width = Math.min(img.width, PRINTER_SETTINGS.maxImageWidth);
    let height = Math.round(width / aspectRatio);

    if (height > PRINTER_SETTINGS.maxImageHeight) {
        height = PRINTER_SETTINGS.maxImageHeight;
        width = Math.round(height * aspectRatio);
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    return {
        rasterData: convertImageToRasterWithThreshold(imageData),
        width,
        height
    };
}

function convertImageToRasterWithThreshold(imageData) {
    const { width, height, data } = imageData;
    const adjustedWidth = Math.ceil(width / 8) * 8;
    const rasterData = new Uint8Array((adjustedWidth / 8) * height);

    let byteIndex = 0;
    let bitIndex = 0;
    const THRESHOLD = 128;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < adjustedWidth; x++) {
            const pixel = x < width ? data[(y * width + x) * 4] : 255;
            const bit = pixel < THRESHOLD ? 1 : 0;

            rasterData[byteIndex] |= bit << (7 - bitIndex);
            bitIndex++;
            if (bitIndex === 8) {
                byteIndex++;
                bitIndex = 0;
            }
        }
    }

    return rasterData;
}

// IMPRIMIR IMAGEN
async function printImage(characteristic, rasterData, width, height) {
    const cmd = [
        0x1B, 0x61, 0x01, // centrar
        0x1D, 0x76, 0x30, 0x00,
        (width / 8) & 0xff, (width / 8) >> 8,
        height & 0xff, height >> 8,
        ...rasterData,
        0x1B, 0x61, 0x00 // alinear a la izquierda
    ];
    await sendInChunks(characteristic, cmd);
}

// FRAGMENTAR ENVÍO
async function sendInChunks(characteristic, data) {
    const MAX = 512;
    for (let i = 0; i < data.length; i += MAX) {
        await characteristic.writeValue(new Uint8Array(data.slice(i, i + MAX)));
    }
}

// CONECTAR BLUETOOTH
async function connectToPrinter() {
    if (!navigator.bluetooth) {
        throw new Error("Tu navegador no soporta Bluetooth.");
    }

    const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [PRINTER_SETTINGS.serviceUUID]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(PRINTER_SETTINGS.serviceUUID);
    return await service.getCharacteristic(PRINTER_SETTINGS.characteristicUUID);
}

// FUNCIÓN PRINCIPAL
export async function printTicket(venta) {
    try {
        const printerChar = await connectToPrinter();
        const ticketText = createTicketContent(venta);
        const encodedText = iconv.encode(ticketText, PRINTER_SETTINGS.encoding);

        const logoUrl = '/images/logoX2.png'; // asegúrate que esta ruta sea accesible desde navegador
        const { rasterData, width, height } = await loadAndConvertImage(logoUrl);

        await printImage(printerChar, rasterData, width, height);
        await sendInChunks(printerChar, encodedText);

        alert('Ticket enviado a la impresora!');
    } catch (error) {
        console.error('Error al imprimir:', error);
        alert('Error al imprimir: ' + error.message);
    }
}
