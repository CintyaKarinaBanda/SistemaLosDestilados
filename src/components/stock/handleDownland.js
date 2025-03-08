export const handleDownload = async (productos) => {
  if (!productos.length) return;

  const productosPorCategoria = productos.reduce((acc, producto) => {
    const categoria = producto.category || "Sin Categoría";
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(producto);
    return acc;
  }, {});

  const margin = 60;
  const tableWidth = 900;
  const canvasWidth = tableWidth + 2 * margin;
  let contentHeight =
    50 +
    Object.keys(productosPorCategoria).length * 50 +
    productos.length * 40;
  const canvasHeight = contentHeight + 2 * margin + 150;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  const fondo = new Image();
  const logo = new Image();
  const whatsappIcon = new Image();
  const instagramIcon = new Image();
  fondo.src = "/images/fondo.jpg";
  logo.src = "/images/logoSinFondo.png";
  whatsappIcon.src = "/images/whatsapp-icon.png";
  instagramIcon.src = "/images/instagram-icon.png";

  Promise.all([
    new Promise((resolve) => (fondo.onload = resolve)),
    new Promise((resolve) => (logo.onload = resolve)),
    new Promise((resolve) => (whatsappIcon.onload = resolve)),
    new Promise((resolve) => (instagramIcon.onload = resolve)),
  ]).then(() => {
    drawBackground(ctx, fondo, canvasWidth, canvasHeight);
    drawHeader(ctx, logo, canvasWidth, margin);
    drawTable(ctx, productosPorCategoria, margin, canvasWidth, contentHeight);
    drawFooter(ctx, whatsappIcon, instagramIcon, margin, canvasHeight);

    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "Stock.png";
    link.click();
  });
};

const drawBackground = (ctx, fondo, canvasWidth, canvasHeight) => {
  ctx.drawImage(fondo, 0, 0, canvasWidth, canvasHeight);
};

const drawHeader = (ctx, logo, canvasWidth, margin) => {
  ctx.fillStyle = "white";
  ctx.font = "bold 45px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("Venta por Caja", canvasWidth / 2 - 80, margin + 50);

  ctx.drawImage(logo, canvasWidth / 2 + 70, margin - 30, 180, 180);
};

const drawTable = (ctx, productosPorCategoria, margin, canvasWidth, contentHeight) => {
  let y = margin + 130;
  const colPositions = [
    margin, // Destilado (izquierda)
    margin + 390, // Piezas (centrado)
    margin + 500, // Mililitros (centrado)
    margin + 650, // Precio x Caja (centrado)
    margin + 835, // Precio x Botella (centrado)
  ];

  Object.keys(productosPorCategoria).forEach((categoria) => {
    ctx.font = "bold 25px 'Times New Roman'";
    ctx.textAlign = "left";
    ctx.fillText(categoria, 30, y);
    y += 40;

    ctx.font = "bold 22px 'Times New Roman'";
    ctx.fillText("Destilado", colPositions[0], y);
    ctx.textAlign = "center";
    ctx.fillText("Piezas", colPositions[1], y);
    ctx.fillText("Mililitros", colPositions[2], y);
    ctx.fillText("Precio x Caja", colPositions[3], y);
    ctx.fillText("Precio x Botella", colPositions[4], y);
    y += 30;

    ctx.font = "18px 'Times New Roman'";
    productosPorCategoria[categoria].forEach((producto) => {
      ctx.textAlign = "left";
      ctx.fillText(producto.name, colPositions[0], y);
      ctx.textAlign = "center";
      ctx.fillText(producto.piece, colPositions[1], y);
      ctx.fillText(producto.mililiters, colPositions[2], y);
      ctx.fillText("$ " + producto.byBox, colPositions[3], y);
      ctx.fillText("$ " + producto.byBottle, colPositions[4], y);
      y += 30;
    });

    y += 20;
  });

  ctx.font = "18px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText(
    "PRECIOS SUJETOS A CAMBIOS SIN PREVIO AVISO",
    canvasWidth / 2,
    contentHeight + 100
  );
};

const drawFooter = (ctx, whatsappIcon, instagramIcon, margin, canvasHeight) => {
  const iconWidth = 40;
  const iconHeight = 40;

  // Posiciones para los íconos
  const whatsappX = margin + 200;
  const whatsappY = canvasHeight - margin - iconHeight - 20;

  const instagramX = whatsappX + 300;
  const instagramY = whatsappY;

  // Dibuja los íconos
  ctx.drawImage(whatsappIcon, whatsappX, whatsappY, iconWidth, iconHeight );
  ctx.drawImage(instagramIcon, instagramX, instagramY, iconWidth, iconHeight);

  // Agrega los textos al lado de los íconos
  ctx.font = "20px 'Times New Roman'";
  ctx.fillText(
    "446 128 3277",
    whatsappX + iconWidth + 70,
    whatsappY + iconHeight / 2 + 10
  );
  ctx.fillText(
    "losdestiladosqro",
    instagramX + iconWidth + 80,
    instagramY + iconHeight / 2 + 10
  );
};
