"""Interface abstraite de tout generateur de document."""

import os
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.core.config import get_settings
from app.core.errors import GenerationError


class DocumentGenerator(ABC):
    """Classe abstraite pour un generateur de document Word/PDF."""

    name: str = "base"

    @abstractmethod
    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Any:
        """Construit le document (retourne un objet python-docx Document)."""
        ...

    def generate(self, data: Dict[str, Any], locale: Dict[str, Any], output_filename: str) -> str:
        """Genere le fichier sur disque et retourne son chemin complet."""
        settings = get_settings()
        output_dir = settings.local_storage_path
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)

        try:
            doc = self.build(data, locale)
            doc.save(output_path)
        except GenerationError:
            raise
        except Exception as e:
            raise GenerationError(
                message=f"Erreur generation {self.name}: {str(e)}",
                details={"generator": self.name, "filename": output_filename},
            ) from e

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise GenerationError(
                message=f"Le fichier {output_filename} n a pas ete cree correctement.",
                details={"generator": self.name},
            )

        return output_path
