"""Extracteur HTML (BeautifulSoup)."""

from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.html")


class HTMLExtractor(DocumentExtractor):
    name = "html"
    extensions = ["html", "htm"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        try:
            from bs4 import BeautifulSoup
            raw = content_bytes.decode("utf-8", errors="ignore")
            soup = BeautifulSoup(raw, "html.parser")

            for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
                tag.decompose()

            return soup.get_text(separator="\n", strip=True)
        except Exception as e:
            logger.warning("html_extract_failed", error=str(e))
            return ""
