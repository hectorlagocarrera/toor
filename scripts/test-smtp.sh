#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: test-smtp.sh -h HOST -p PORT -u USER -P PASS -f FROM -t TO [opciones]

Envia un correo de prueba via SMTP usando curl, para comprobar que un
servidor/cuenta SMTP funciona correctamente.

Obligatorios:
  -h HOST     Servidor SMTP (ej: smtp.gmail.com)
  -p PORT     Puerto SMTP (ej: 587, 465, 25)
  -u USER     Usuario para autenticacion
  -P PASS     Contrasena para autenticacion
  -f FROM     Direccion remitente
  -t TO       Direccion destinataria

Opcionales:
  -s SUBJECT  Asunto (por defecto: "Prueba SMTP")
  -b BODY     Cuerpo del mensaje (por defecto: mensaje generico)
  -S          Usar SSL/TLS implicito (smtps://) en vez de STARTTLS
  -k          No verificar certificado TLS (solo para pruebas)
  -v          Modo verboso (muestra la conversacion SMTP completa)

Variables de entorno equivalentes (si no se pasan flags):
  SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM SMTP_TO

Ejemplos:
  test-smtp.sh -h smtp.gmail.com -p 587 -u yo@gmail.com -P "app-password" \
    -f yo@gmail.com -t destino@ejemplo.com

  test-smtp.sh -h smtp.ejemplo.com -p 465 -S -u user -P pass \
    -f user@ejemplo.com -t destino@ejemplo.com -v
EOF
}

host="${SMTP_HOST:-}"
port="${SMTP_PORT:-}"
user="${SMTP_USER:-}"
pass="${SMTP_PASS:-}"
from="${SMTP_FROM:-}"
to="${SMTP_TO:-}"
subject="Prueba SMTP"
body="Este es un correo de prueba enviado con test-smtp.sh el $(date -u '+%Y-%m-%d %H:%M:%S UTC')."
use_ssl=false
insecure=false
verbose=false

while getopts "h:p:u:P:f:t:s:b:Skv" opt; do
  case "$opt" in
    h) host="$OPTARG" ;;
    p) port="$OPTARG" ;;
    u) user="$OPTARG" ;;
    P) pass="$OPTARG" ;;
    f) from="$OPTARG" ;;
    t) to="$OPTARG" ;;
    s) subject="$OPTARG" ;;
    b) body="$OPTARG" ;;
    S) use_ssl=true ;;
    k) insecure=true ;;
    v) verbose=true ;;
    *) usage; exit 1 ;;
  esac
done

if [[ -z "$host" || -z "$port" || -z "$user" || -z "$pass" || -z "$from" || -z "$to" ]]; then
  echo "Error: faltan parametros obligatorios." >&2
  echo >&2
  usage >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: se necesita 'curl' instalado." >&2
  exit 1
fi

if $use_ssl; then
  url="smtps://${host}:${port}"
else
  url="smtp://${host}:${port}"
fi

msg_file="$(mktemp)"
trap 'rm -f "$msg_file"' EXIT

cat > "$msg_file" <<EOF
From: <${from}>
To: <${to}>
Subject: ${subject}
Date: $(date -R)

${body}
EOF

curl_args=(
  --url "$url"
  --mail-from "$from"
  --mail-rcpt "$to"
  --user "${user}:${pass}"
  --upload-file "$msg_file"
)

if ! $use_ssl; then
  curl_args+=(--ssl-reqd)
fi

$insecure && curl_args+=(--insecure)
$verbose && curl_args+=(--verbose)

echo "Enviando correo de prueba a ${to} via ${url} ..."
if curl "${curl_args[@]}"; then
  echo "OK: correo enviado correctamente."
else
  echo "ERROR: fallo el envio del correo." >&2
  exit 1
fi
