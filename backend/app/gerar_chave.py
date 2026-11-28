import os
import requests

# Utilitário local para obter a Public Key do PagBank (sandbox).
# O token NUNCA deve ficar no código: defina PAGBANK_TOKEN no ambiente antes de executar.
TOKEN = os.environ.get("PAGBANK_TOKEN")
URL = os.environ.get("PAGBANK_PUBLIC_KEYS_URL", "https://sandbox.api.pagseguro.com/public-keys")

if not TOKEN:
    raise SystemExit("Defina a variável de ambiente PAGBANK_TOKEN antes de executar este script.")

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "type": "card"
}

response = requests.post(URL, json=payload, headers=headers)
print("A sua Public Key para o Frontend é:")
print(response.json())