"""Test isole de l'OCR sur un PDF."""

import os
from pathlib import Path

from dotenv import load_dotenv

from app.services.ingestion.pdf import PDFExtractor

load_dotenv()

print("Tesseract :", os.getenv("TESSERACT_CMD", "PATH par defaut"))
print()

pdf_path = input("Chemin du PDF a tester : ").strip().strip('"')

if not os.path.exists(pdf_path):
    print(f"ERREUR : fichier introuvable : {pdf_path}")
    exit(1)

with open(pdf_path, "rb") as f:
    content_bytes = f.read()

print(f"Taille : {len(content_bytes)} octets")
print()

extractor = PDFExtractor()

try:
    text = extractor.extract(content_bytes, os.path.basename(pdf_path))
    print("=" * 60)
    print(f"SUCCES : {len(text)} caracteres extraits")
    print("=" * 60)
    print(text[:1000])
    print("...")
except Exception as e:
    print(f"ECHEC : {type(e).__name__} : {e}")