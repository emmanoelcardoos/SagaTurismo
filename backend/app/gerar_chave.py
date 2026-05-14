import requests

# Substitua pelo seu Token de SANDBOX do PagBank
TOKEN = "ba581b7d-967b-48f9-a9cd-9734f4a60e016ce5a9f7427f80e7b6344acc8ff17c984768-f9f1-41b8-806a-50abb6c3c092" 
URL = "https://sandbox.api.pagseguro.com/public-keys"

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