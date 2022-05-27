openssl genrsa -out private.key 2048
openssl req -x509 -days 365 -new -sha256 -key private.key -out public.crt