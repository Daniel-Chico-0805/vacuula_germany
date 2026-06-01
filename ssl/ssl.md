<img alt="vacuula Logo" src="../pics/logo.svg" width="50">

# vacuula ssl certificates
To make the install as easy as possible by default vacuula will use the `default-vacuula.crt` located in this folder for your custom server.

If you want to use your own certificates, run the following command in the `ssl/` folder and copy the `vacuula.crt` to the location the repair guide told you!
```bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 36500 -nodes -keyout vacuula.key -out vacuula.crt -config vacuula.cnf
```

