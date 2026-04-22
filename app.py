from flask import Flask, request, jsonify
import os

app = Flask(__name__)

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

@app.route('/webhook', methods=['POST'])
def webhook():
    # Asumimos una carga genérica o Meta API. Aquí iría la lógica de envío de respuesta de vuelta a WhatsApp.
    data = request.json
    print("Datos recibidos:", data)
    return jsonify({"status": "success"}), 200

@app.route('/', methods=['GET'])
def index():
    return "Servidor del Bot de Gym Sabana en línea."

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
