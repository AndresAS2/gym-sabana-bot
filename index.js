const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

let lastQr = "";
let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            lastQr = qr;
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('conexión cerrada debido a ', lastDisconnect.error, ', reconectando ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('¡Bot de Gym Sabana conectado! 💪');
            lastQr = "";
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const remoteJid = msg.key.remoteJid;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
            const lowerBody = body.toLowerCase();

            console.log(`Mensaje recibido de ${remoteJid}: ${body}`);

            let response = "";
            if (lowerBody.includes('horario')) {
                response = 'Nuestro horario es: Lunes a Viernes, 5:00 am – 9:00 pm. [FOTO_HORARIO]';
            } else if (lowerBody.includes('precio') || lowerBody.includes('mensualidad') || lowerBody.includes('costo') || lowerBody.includes('dia') || lowerBody.includes('trimestre')) {
                response = 'Mensualidad: $60.000 COP | Trimestre: $150.000 COP | Día: $7.000 COP.';
            } else if (lowerBody.includes('inscripci') || lowerBody.includes('inscribir')) {
                response = 'Las inscripciones son únicamente presenciales. ¡Te esperamos!';
            } else if (lowerBody.includes('hola') || lowerBody.includes('buenos dias') || lowerBody.includes('buenas tardes') || lowerBody.includes('buenas noches')) {
                response = '¡Bienvenido/a a la familia Gym Sabana! 💪';
            } else {
                if (!remoteJid.includes('@g.us')) {
                    response = 'Lo consultaré con el equipo.';
                }
            }

            if (response) {
                await sock.sendMessage(remoteJid, { text: response });
            }
        }
    });
}

connectToWhatsApp();

// Servidor web para ver el QR
app.get('/', (req, res) => {
    if (lastQr) {
        qrcode.toDataURL(lastQr, (err, url) => {
            res.send(`
                <div style="text-align: center; font-family: sans-serif; background: #f0f2f5; padding: 50px; min-height: 100vh;">
                    <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="color: #128c7e;">Vincular Gym Sabana Bot</h1>
                        <p>Abre WhatsApp en tu teléfono y escanea este código:</p>
                        <img src="${url}" style="width: 300px; height: 300px;" />
                        <p style="color: #666; font-size: 0.9em;">Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo</p>
                        <script>setTimeout(() => location.reload(), 15000);</script>
                    </div>
                </div>
            `);
        });
    } else {
        res.send(`
            <div style="text-align: center; font-family: sans-serif; padding: 50px;">
                <h1 style="color: #128c7e;">¡Bot de Gym Sabana Activo!</h1>
                <p>El bot ya está conectado o está procesando la sesión.</p>
                <p>Si aún no lo has vinculado, refresca la página en 10 segundos.</p>
            </div>
        `);
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor de salud escuchando en puerto ${port}`);
});
