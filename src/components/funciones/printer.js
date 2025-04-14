import { createCanvas, loadImage } from 'canvas';
import iconv from 'iconv-lite';

// CONFIGURACIÓN GENERAL DE LA IMPRESORA
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

// UTILIDADES
const centerText = (text) => {
    const spaces = Math.max(0, PRINTER_SETTINGS.maxLineLength - text.length);
    const leftPadding = Math.floor(spaces / 2);
    const rightPadding = spaces - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
};

const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00Z');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
};

function formatProductLine({ nombre, precio, cantidad, descuento, montoDescuento }) {
    const subtotal = precio * cantidad - (montoDescuento || 0);
    const subtotalStr = `$${subtotal.toFixed(2)}`;
    const detalle = `$${precio} x ${cantidad}${descuento ? ` - $${montoDescuento}` : ''}`;
    const leftPart = '  ' + detalle;
    const spaces = Math.max(0, PRINTER_SETTINGS.maxLineLength - leftPart.length - subtotalStr.length - 1);
    return `${nombre}\n${leftPart}${' '.repeat(spaces)}${subtotalStr}`;
}

// CREACIÓN DEL CONTENIDO DEL TICKET
function createTicketContent({ noNota, nombreCliente, fechaCompra, productos, impuestos, porcentajeImpuestos, dineroImpuestos, envio, montoEnvio, tipoPago, total }) {
    const boldOn = PRINTER_SETTINGS.boldOn;
    const boldOff = PRINTER_SETTINGS.boldOff;

    return [
        boldOn + centerText('') + boldOff,
        boldOn + centerText('Los Destilados') + boldOff,
        boldOn + centerText('Querétaro, Querétaro') + boldOff,
        ...'\nNuestros Licores son disfrute,\nson diversión, son felicidad,\nson sinónimo de celebración\n '.split('\n').map(centerText),
        `Número de Nota: ${noNota}`,
        `Cliente: ${nombreCliente}`,
        `Fecha de Compra: ${formatearFecha(fechaCompra)}`,
        '--------------------------------',
        ...productos.map(formatProductLine),
        impuestos ? `Impuestos ${porcentajeImpuestos}%: ${' '.repeat(10)}$${dineroImpuestos}` : null,
        envio ? `Envío: ${' '.repeat(20)}$${montoEnvio}` : null,
        boldOn + `Total:${' '.repeat(17)}$${total.toFixed(2)}` + boldOff,
        tipoPago,
        '--------------------------------',
        ...'Se admiten cambios y\ndevoluciones en mercancia, en\nun plazo de 30 días apartir de\nsu fecha de compra y\npresentando la nota.\nConsulta términos y \ncondiciones de la garantia.\n\nSiguienos en instagram\n@losdestiladosqro\n\nCONSERVAR SU NOTA\nPARA CUALQUIER ACLARACIÓN\n\nContamos con facturación\npregunta por este servicio vía\nWhatsapp 4461283277\n¡Gracias por su compra!'.split('\n').map(centerText)
    ].filter(Boolean).join('\n');
}

// MANEJO DE IMAGEN
async function loadAndConvertImage(imageUrl) {
    try {
        const img = await loadImage(imageUrl);

        const aspectRatio = img.width / img.height;
        let width = img.width;
        let height = img.height;

        if (width > PRINTER_SETTINGS.maxImageWidth) {
            width = PRINTER_SETTINGS.maxImageWidth;
            height = Math.round(width / aspectRatio);
        }
        if (height > PRINTER_SETTINGS.maxImageHeight) {
            height = PRINTER_SETTINGS.maxImageHeight;
            width = Math.round(height * aspectRatio);
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height); 

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const rasterData = convertImageToRasterWithThreshold(imageData);

        return { rasterData, width: canvas.width, height: canvas.height };
    } catch (error) {
        console.error('Error al cargar o convertir la imagen:', error);
        throw error;
    }
}

function convertImageToRasterWithThreshold(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

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

async function printImage(printerCharacteristic, rasterData, width, height) {
    const command = [];
    command.push(0x1B, 0x61, 0x01); 
    command.push(0x1D, 0x76, 0x30, 0x00); 
    command.push((width / 8) & 0xff);
    command.push((width / 8) >> 8);
    command.push(height & 0xff);
    command.push(height >> 8);
    command.push(...rasterData);
    command.push(0x1B, 0x61, 0x00); 

    await sendInChunks(printerCharacteristic, command);
}

async function sendInChunks(printerCharacteristic, data) {
    const MAX_SIZE = 512;

    for (let offset = 0; offset < data.length; offset += MAX_SIZE) {
        const chunk = new Uint8Array(data.slice(offset, offset + MAX_SIZE));
        await printerCharacteristic.writeValue(chunk);
    }
}

// CONEXIÓN BLUETOOTH
async function connectToPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [PRINTER_SETTINGS.serviceUUID],
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(PRINTER_SETTINGS.serviceUUID);
        const characteristic = await service.getCharacteristic(PRINTER_SETTINGS.characteristicUUID);

        return characteristic;
    } catch (error) {
        console.error('Error al conectar a la impresora:', error);
        alert('No se pudo conectar a la impresora. Asegúrate de que esté encendida y en modo Bluetooth.');
        throw error;
    }
}

// FUNCIÓN PRINCIPAL
export async function printTicket(venta) {
    try {
        const printerCharacteristic = await connectToPrinter();
        const ticketContent = createTicketContent(venta);
        const encodedContent = iconv.encode(ticketContent, PRINTER_SETTINGS.encoding);

        const imageUrl = '/images/logoX2.png';
        const { rasterData, width, height } = await loadAndConvertImage(imageUrl);

        await printImage(printerCharacteristic, rasterData, width, height);
        await sendInChunks(printerCharacteristic, encodedContent);

        alert('Ticket enviado a la impresora!');
    } catch (error) {
        console.error('Error en el proceso de impresión:', error);
        alert('Hubo un error al imprimir el ticket.');
    }
}
