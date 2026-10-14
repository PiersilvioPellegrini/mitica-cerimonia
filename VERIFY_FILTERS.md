# Protocollo di Verifica Filtri - Mitica Cerimonia

Questo file serve a verificare manualmente che tutti i nuovi sistemi di filtraggio funzionino correttamente.

## 1. Catalogo (Public)
- [ ] **Barra Categorie (Row 1)**: Clicca su "Bambini". La collezione deve cambiare e mostrare solo abiti bimbo/bimba.
- [ ] **Filtri Laterali (Mobile/Desktop)**: Apri il menu filtri. Deve apparire **solo il filtro colore** (tranne in Promozione). Verifica che la selezione funzioni.

## 2. Inventario (Admin)
- [ ] **Filtri Rapidi**: Clicca sulla bolla "Sposa" sopra la barra di ricerca. L'inventario deve mostrare solo la categoria Sposa e aprirla automaticamente.
- [ ] **Ricerca + Espansione**: Scrivi il nome di un brand o un codice nella barra di ricerca. Tutte le categorie che contengono quel prodotto devono aprirsi automaticamente.
- [ ] **Reset**: Clicca sulla "X" nella barra di ricerca. L'elenco deve tornare allo stato iniziale.

## 3. Importazione (Admin)
- [ ] **Paginazione**: Carica un file CSV o un'immagine di fattura con più di 30 articoli. Verifica che appaiano i numeri di pagina in fondo.
- [ ] **Ricerca in Revisione**: Usa la barra di ricerca nella schermata di revisione. Deve filtrare i prodotti importati e resettare la pagina a 1.
- [ ] **Selezione**: Seleziona alcuni prodotti nella pagina 1, vai alla pagina 2 e selezionane altri. Clicca su "Importa" e verifica che vengano importati solo quelli selezionati correttamente.
