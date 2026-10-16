"""
Script de verification de la base de donnees Supabase.

Les tables sont creees via l'editeur SQL de Supabase (voir scripts/schema.sql).
Ce script verifie que les 5 tables existent et sont accessibles.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()


def main() -> None:
    """Verifie que les tables existent dans Supabase."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("ERREUR : SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant dans .env")
        sys.exit(1)

    print("Verification de la base de donnees Supabase...")
    print(f"URL : {url[:50]}...")
    print()

    try:
        client = create_client(url, key)
    except Exception as e:
        print(f"ERREUR connexion : {e}")
        sys.exit(1)

    tables = ["profiles", "generations", "payments", "relances", "ai_logs"]
    erreurs = 0

    print("Verification des tables :")
    for t in tables:
        try:
            client.table(t).select("*").limit(1).execute()
            print(f"  OK   {t}")
        except Exception as e:
            err = str(e)
            if "does not exist" in err or "PGRST205" in err:
                print(f"  ERR  {t} : table manquante")
            else:
                print(f"  ERR  {t} : {err[:80]}")
            erreurs += 1

    print()
    if erreurs == 0:
        print("=" * 60)
        print("SUCCES : Les 5 tables sont operationnelles")
        print("=" * 60)
    else:
        print(f"ERREUR : {erreurs} table(s) manquante(s) ou inaccessible(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()