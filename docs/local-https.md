# HTTPS for Local Development

This project supports running the local development server over **HTTPS** for a more production-like environment.

## 1. Generate Self-Signed Certificates

You need a self-signed SSL certificate and key for local HTTPS.
Run the following command in your project root to generate them:

```sh
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

## 2. Move Certificates to the `certs` Folder

Create a `certs` directory in your project root and move the generated files:

```sh
mkdir -p certs
mv localhost.crt certs/
mv localhost.key certs/
```

Your project structure should now include:

```
trip-fotos-react/
  certs/
    localhost.crt
    localhost.key
  ...
```

## 3. Keep the certificates out of Git

`certs/` is already in `.gitignore`; never commit the key.

## 4. Vite HTTPS Configuration

The Vite config is set up to use these certificates for HTTPS **only in local development**.
If the `certs` folder or files are missing, Vite will fall back to HTTP (as in CI or Vercel deployments).

## 5. Start the Development Server

```sh
npm run dev
```

Visit [https://localhost:3000](https://localhost:3000) in your browser.
You may see a browser warning about the self-signed certificate—this is expected for local development.
