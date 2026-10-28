# Financial AI Advisor — interface Streamlit

Interface locale d'analyse : cours, décision, marché, portefeuille,
dividendes, journal et paramètres. Le cœur métier (`config.py`,
`services/`) n'est pas dupliqué ici : il est importé depuis le backend,
dossier voisin `../trade_back` (ou celui indiqué par `TRADE_BACK_DIR`), via
`backend_path.py`. Données, modèle et résultats sont donc ceux du backend.

## Installation

Le plus simple est de réutiliser l'environnement virtuel du backend :

```bash
../trade_back/.venv/bin/python -m pip install -r requirements-dev.txt
```

## Utilisation

```bash
../trade_back/.venv/bin/python -m streamlit run app.py
```

Tests (dont le test de fumée qui lance réellement chaque page) :

```bash
../trade_back/.venv/bin/python -m pytest
```

## Structure

```
app.py              Point d'entrée Streamlit : marque, navigation,
                      import et sélection de structure
backend_path.py     Rend importables config et services/ du backend
app_pages/          Analyse, Marché, Portefeuille, Dividendes, Journal,
                      Paramètres
ui/
  loaders.py          Chargements Streamlit mis en cache
  themes.py           Palettes de couleurs
  avatar.py           Avatar de l'assistant vocal
.streamlit/         Thème Streamlit
tests/              Test de fumée des pages
```
