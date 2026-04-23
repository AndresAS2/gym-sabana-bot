const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let lastQr = "";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    lastQr = qr;
    qrcode.generate(qr, {small: true});
    console.log('QR RECIBIDO. Escanea el código en la consola o en la web.');
});

client.on('ready', () => {
    console.log('¡Bot de Gym Sabana listo y conectado! 💪');
});

client.on('message', async (msg) => {
    const message = msg.body.toLowerCase();
    
    // Lógica de Gym Sabana
    if (message.includes('horario')) {
        msg.reply('Nuestro horario es: Lunes a Viernes, 5:00 am – 9:00 pm. [FOTO_HORARIO]');
    } else if (message.includes('precio') || message.includes('mensualidad') || message.includes('costo') || message.includes('dia') || message.includes('trimestre')) {
        msg.reply('Mensualidad: $60.000 COP | Trimestre: $150.000 COP | Día: $7.000 COP.');
    } else if (message.includes('inscripci') || message.includes('inscribir')) {
        msg.reply('Las inscripciones son únicamente presenciales. ¡Te esperamos!');
    } else if (message.includes('hola') || message.includes('buenos dias') || message.includes('buenas tardes') || message.includes('buenas noches')) {
        msg.reply('¡Bienvenido/a a la familia Gym Sabana! 💪');
    } else {
        // Opcional: Solo responder a chats privados si no entiende
        if (!msg.from.includes('@g.us')) {
            msg.reply('Lo consultaré con el equipo.');
        }
    }
});

client.initialize();

// Servidor web para ver el QR
app.get('/', (req, res) => {
    if (lastQr) {
        QRCode.toDataURL(lastQr, (err, url) => {
            res.send(`
                <div style="text-align: center; font-family: sans-serif;">
                    <h1>Escanea el QR para vincular Gym Sabana Bot</h1>
                    <img src="${url}" />
                    <p>Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo</p>
                    <script>setTimeout(() => location.reload(), 30000);</script>
                </div>
            `);
        });
    } else {
        res.send('<h1>El bot ya está conectado o generando el QR... refresca en unos segundos.</h1>');
    }
});

app.listen(port, () => {
    console.log(`Servidor web en puerto ${port}`);
});
