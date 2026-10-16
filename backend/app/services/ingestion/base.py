"""Interface abstraite de tout extracteur de document."""

from abc import ABC, abstractmethod

from app.core.errors import IngestionError


class DocumentExtractor(ABC):
    """Classe abstraite pour un extracteur de document."""

    name: str = "base"
    extensions: list = []

    @abstractmethod
    def extract(self, content_bytes: bytes, filename: str) -> str:
        """Extrait le texte brut depuis les octets du fichier."""
        ...

    def can_handle(self, filename: str) -> bool:
        """Retourne True si l extracteur gere l extension du fichier."""
        if "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[-1].lower()
        return ext in self.extensions

    def safe_extract(self, content_bytes: bytes, filename: str) -> str:
        """Point d entree public. Gere les erreurs et le nettoyage."""
        try:
            text = self.extract(content_bytes, filename)
        except IngestionError:
            raise
        except Exception as e:
            raise IngestionError(
                message=f"Erreur extraction {self.name}: {str(e)}",
                details={"extractor": self.name, "filename": filename},
            ) from e

        cleaned = self._clean(text)
        if not cleaned:
            raise IngestionError(
                message=f"Le fichier {filename} est vide ou illisible.",
                details={"extractor": self.name, "filename": filename},
            )
        return cleaned

    @staticmethod
    def _clean(text: str) -> str:
        """Nettoyage de base."""
        if not text:
            return ""
        lines = [line.rstrip() for line in text.splitlines()]
        lines = [line for line in lines if line.strip()]
        return "\n".join(lines).strip()
