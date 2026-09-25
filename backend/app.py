import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Falta JWT_SECRET_KEY en el entorno (backend/.env)")

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": os.environ.get("CORS_ORIGINS", "*")}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

usuarios = {
    "admin": {"password": generate_password_hash("admin123"), "rol": "admin"},
    "juan": {"password": generate_password_hash("juan123"), "rol": "usuario"},
}


def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"mensaje": "Token requerido"}), 401
        try:
            datos = jwt.decode(auth[7:], SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"mensaje": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"mensaje": "Token inválido"}), 401
        return func(datos, *args, **kwargs)

    return decorated


def admin_required(func):
    @wraps(func)
    def decorated(datos, *args, **kwargs):
        if datos.get("rol") != "admin":
            return jsonify({"mensaje": "Acceso denegado. Se requiere rol admin."}), 403
        return func(datos, *args, **kwargs)

    return decorated


@app.route("/", methods=["GET"])
def estado():
    return jsonify({"mensaje": "API de autenticación activa"}), 200


@app.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    usuario = body.get("usuario")
    password = body.get("password")

    if not usuario or not password:
        return jsonify({"mensaje": "Faltan datos: usuario y password son requeridos"}), 400

    cuenta = usuarios.get(usuario)
    if not cuenta:
        # TODO producción: unificar mensaje para no revelar usuarios existentes
        return jsonify({"mensaje": "Usuario no existe"}), 401

    if not check_password_hash(cuenta["password"], password):
        # TODO producción: unificar mensaje para no revelar usuarios existentes
        return jsonify({"mensaje": "Contraseña incorrecta"}), 401

    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    token = jwt.encode(
        {"usuario": usuario, "rol": cuenta["rol"], "exp": exp},
        SECRET_KEY,
        algorithm="HS256",
    )

    return (
        jsonify(
            {
                "mensaje": "Inicio de sesión exitoso",
                "usuario": usuario,
                "rol": cuenta["rol"],
                "token": token,
            }
        ),
        200,
    )


@app.route("/perfil", methods=["GET"])
@token_required
def perfil(datos):
    return (
        jsonify(
            {
                "usuario": datos.get("usuario"),
                "rol": datos.get("rol"),
                "mensaje": "Acceso autorizado al perfil",
            }
        ),
        200,
    )


@app.route("/usuarios", methods=["GET"])
@token_required
@admin_required
def usuarios_lista(datos):
    return jsonify({"usuarios": list(usuarios.keys())}), 200


if __name__ == "__main__":
    # Solo para depurar; en uso normal se arranca con run.sh (Gunicorn)
    app.run(host="127.0.0.1", port=5000, debug=True)
