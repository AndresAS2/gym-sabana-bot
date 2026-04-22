from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

def send_whatsapp_message(to, text):
    token = os.environ.get("WHATSAPP_TOKEN")
    phone_number_id = os.environ.get("PHONE_NUMBER_ID")
    if not token or not phone_number_id:
        print("Faltan WHATSAPP_TOKEN o PHONE_NUMBER_ID")
        return
    
    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Respuesta de WhatsApp API: {response.status_code} - {response.text}")

def get_response(incoming_msg):
    msg = incoming_msg.lower()
    
    if "horario" in msg:
        return "Nuestro horario es: Lunes a Viernes, 5:00 am – 9:00 pm. [FOTO_HORARIO]"
    elif "precio" in msg or "mensualidad" in msg or "costo" in msg or "dia" in msg or "trimestre" in msg:
        return "Mensualidad: $60.000 COP | Trimestre: $150.000 COP | Día: $7.000 COP."
    elif "inscripci" in msg or "inscribir" in msg:
        return "Las inscripciones son únicamente presenciales. ¡Te esperamos!"
    elif "hola" in msg or "buenos dias" in msg or "buenas tardes" in msg or "buenas noches" in msg or "saludos" in msg:
        return "¡Bienvenido/a a la familia Gym Sabana! 💪"
    else:
        return "Lo consultaré con el equipo."

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        # Verificación de Meta (WhatsApp Cloud API)
        verify_token = os.environ.get("VERIFY_TOKEN", "gym_sabana_token")
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        
        if mode == 'subscribe' and token == verify_token:
            return challenge, 200
        else:
            return "Error de verificación", 403

    # Procesamiento de mensajes (POST)
    data = request.json
    try:
        if data.get("object") == "whatsapp_business_account":
            for entry in data.get("entries", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    if messages:
                        msg = messages[0]
                        sender_id = msg.get("from")
                        text = msg.get("text", {}).get("body", "")
                        
                        response_text = get_response(text)
                        send_whatsapp_message(sender_id, response_text)
                        print(f"Enviando respuesta a {sender_id}: {response_text}")

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Error procesando webhook: {e}")
        return jsonify({"status": "error"}), 500

@app.route('/', methods=['GET'])
def index():
    return "Servidor del Bot de Gym Sabana en línea."

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
