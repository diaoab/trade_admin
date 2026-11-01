"""Rend importable le paquet `core` du backend (dossier trade_back).

L'interface Streamlit ne duplique pas le coeur metier : elle l'importe
depuis le dossier du backend, voisin par defaut, ou celui de TRADE_BACK_DIR.
Donnees, modele et resultats sont donc ceux du backend (cf. core/constants.py).
"""

import os
import sys
from pathlib import Path


BACK_DIR = Path(os.environ.get(
    "TRADE_BACK_DIR",
    Path(__file__).resolve().parent.parent / "trade_back"
)).resolve()

if not (BACK_DIR / "core" / "constants.py").is_file():
    raise RuntimeError(
        f"Backend introuvable dans {BACK_DIR} : definir TRADE_BACK_DIR."
    )

if str(BACK_DIR) not in sys.path:
    sys.path.insert(0, str(BACK_DIR))
