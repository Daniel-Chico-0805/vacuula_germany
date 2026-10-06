import ssl

CERT = "./data/ssl/cert.pem"
KEY = "./data/ssl/privkey.pem"


def create_ssl_context():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=CERT, keyfile=KEY)
    
    context.minimum_version = ssl.TLSVersion.TLSv1
    context.set_ciphers("ALL:@SECLEVEL=0")

    return context