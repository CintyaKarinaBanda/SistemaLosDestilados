import { createCanvas, loadImage } from 'canvas';
import iconv from 'iconv-lite';
import escposEncoder from 'esc-pos-encoder';

// Función para cargar y convertir la imagen
async function loadAndConvertImage(imageUrl) {
    try {
        const img = await loadImage(imageUrl);

        // Redimensionar la imagen para mejorar el rendimiento
        const maxWidth = 256; // Ejemplo de tamaño máximo
        const maxHeight = 256;

        const aspectRatio = img.width / img.height;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
        }
        if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height); // Redibujar la imagen redimensionada

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const rasterData = convertImageToRasterWithThreshold(imageData);

        return { rasterData, width: canvas.width, height: canvas.height };
    } catch (error) {
        console.error('Error al cargar o convertir la imagen:', error);
        throw error;
    }
}

// Función para convertir la imagen a formato raster con umbral (thresholding)
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

// Función para imprimir la imagen
async function printImage(printerCharacteristic, rasterData, width, height) {
    const ESC = '\x1B';
    const GS = '\x1D';

    const command = [];
    command.push(...[0x1D, 0x76, 0x30, 0x00]);
    command.push((width / 8) & 0xff);
    command.push((width / 8) >> 8);
    command.push(height & 0xff);
    command.push(height >> 8);
    command.push(...rasterData);

    await sendInChunks(printerCharacteristic, command);
}

// Función para enviar datos en chunks
async function sendInChunks(printerCharacteristic, data) {
    const MAX_SIZE = 512;

    for (let offset = 0; offset < data.length; offset += MAX_SIZE) {
        const chunk = new Uint8Array(data.slice(offset, offset + MAX_SIZE));
        await printerCharacteristic.writeValue(chunk);
    }
}

// Función para conectar a la impresora Bluetooth
async function connectToPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        });

        const server = await device.gatt.connect();

        if (!server.connected) {
            throw new Error('El servidor GATT no está conectado.');
        }

        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

        if (!characteristic) {
            throw new Error('No se encontró una característica de impresión válida.');
        }

        return characteristic;
    } catch (error) {
        console.error('Error al conectar a la impresora:', error);
        alert('No se pudo conectar a la impresora. Asegúrate de que esté encendida y en modo Bluetooth.');
        throw error;
    }
}

// Función principal para imprimir el ticket
export async function printTicket(venta) {
    try {
        const printerCharacteristic = await connectToPrinter();
        const ticketContent = createTicketContent(venta);
        const encodedContent = iconv.encode(ticketContent, 'CP850');
        const encoder = new escposEncoder();

        // Cargar y convertir la imagen
        const imageUrl = '/images/logoX2.png';
        const { rasterData, width, height } = await loadAndConvertImage(imageUrl);

        // Imprimir la imagen
        await printImage(printerCharacteristic, rasterData, width, height);

        // Codificar el contenido del ticket
        const ticketEncoded = encoder
            .raw(rasterData) // Agregar la imagen al inicio del ticket
            .raw(encodedContent) // Agregar el contenido de texto al ticket
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

function createTicketContent({ noNota, nombreCliente, fechaCompra, productos, impuestos, porcentajeImpuestos, dineroImpuestos, envio, montoEnvio, tipoPago, total }) {
    const maxLineLength = 32;

    const centerText = (text) => {
        const spaces = Math.max(0, maxLineLength - text.length);
        const leftPadding = Math.floor(spaces / 2);
        const rightPadding = spaces - leftPadding;
        return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
    };

    const boldOn = '\x1b\x45\x01';
    const boldOff = '\x1b\x45\x00';

    let content = [
        boldOn + centerText('Los Destilados') + boldOff,
        boldOn + centerText('Querétaro, Querétaro') + boldOff + '\n',
        ...'Nuestros Licores son disfrute, \nson diversión, son felicidad, \nson sinónimo de celebración'.split('\n').map(centerText) + '\n',
        `Número de Nota: ${noNota}`,
        `Cliente: ${nombreCliente}`,
        `Fecha de Compra: ${fechaCompra}`,
        '--------------------------------',
        ...productos.map(formatProductLine) + '\n',
        impuestos && `Impuestos ${porcentajeImpuestos}%: ${' '.repeat(10)}$${dineroImpuestos}`,
        envio && `Envío: $${montoEnvio}`,
        boldOn + `Total:${' '.repeat(17)}$${total.toFixed(2)}` + boldOff,
        tipoPago,
        '--------------------------------\n',
	...'Se admiten cambios y\ndevoluciones en mercancia, en\nun plazo de 30 días apartir de\nsu fecha de compra y\npresentando la nota.\nConsulta términos y \n condiciones de la garantia.\n\nSiguienos en instagram\n@losdestiladosqro\n\nCONSERVAR SU NOTA\nPARA CUALQUIER ACLARACIÓN\n\nContamos con facturación\npregunta por este servicio vía\nWhatsapp 4461283277\n\n¡Gracias por su compra!'.split('\n').map(centerText) + '\n',
    ].filter(Boolean).join('\n');

    return content;
}

function formatProductLine({ nombre, precio, cantidad, descuento, montoDescuento }) {
    const subtotal = precio * cantidad - (montoDescuento || 0);
    const namePadding = ' '.repeat(Math.max(0, 23 - nombre.length));
    return `${nombre}${namePadding} $${subtotal.toFixed(2)}\n  $${precio} x ${cantidad}${descuento ? `  - $${montoDescuento} descuento` : ''}`;
}
