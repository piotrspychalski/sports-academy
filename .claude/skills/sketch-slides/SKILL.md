---
name: sketch-slides
description: Turn Piotr's plain description of a recording ("slajdy: fuel mix przy 50%, potem 90%, potem 120%; potem ściana przy 75% z niskim i z załadowanym glikogenem") into an ordered slide sequence of the Sports Academy master sketch (reference/energy-map.html = the public Akademia), saved as data/slides/<id>.json and played in the slide player (studio/sketch/) and in the reel recording studio (studio/, panel ROLKA → Sekwencja slajdów). Use when Piotr asks for slides, a slide sequence, a recording plan or "co ma być pokazane po kolei" for the master sketch / energy map, or wants to change, reorder or check an existing sequence.
---

# Slajdy szkicu wzorcowego do studia nagrań

Jeden **slajd** = jeden stan szkicu `reference/energy-map.html`: temat, narząd w prawym panelu, wartości suwaków,
opcjonalnie otwarte sekcje lewego panelu, rycina narządu na pełnym ekranie, odtwarzanie czasu.
**Sekwencja** = uporządkowana lista slajdów w `data/slides/<id>.json`. Studio (`studio/sketch/index.html`) wyświetla szkic
w ramce o stałym rozmiarze i przechodzi po slajdach klawiszami jak studio rycin.

Odpowiadaj Piotrowi po polsku. Treść slajdów (`label`, `note`) po angielsku, jak szkic.

## Kroki

1. **Słownik.** Uruchom `node tools/sketch-slides.js --vocab` (w katalogu repo — lokalnie folder `hoebm-academy`, na GitHubie `sports-academy`), żeby mieć aktualne numery tematów
   i narządy — szkic się zmienia, nie polegaj tylko na tabeli niżej.
2. **Przełóż opis na slajdy.** Jedno „potem” / przecinek / „vs” = nowy slajd. „X przy 50%, 90%, 120%” = trzy slajdy tego samego tematu.
   „niski vs załadowany glikogen” = dwa slajdy różniące się jednym polem. Podawaj w slajdzie **tylko to, co się zmienia** —
   reszta dziedziczy się po poprzednim (jak w prezentacji). Nie zgaduj liczb, których Piotr nie podał: zostaw wartość domyślną / odziedziczoną
   i powiedz to w podsumowaniu. Jeśli opis jest niejednoznaczny co do tematu (np. „oddychanie” może być 3.2 albo 4.1), zapytaj jednym pytaniem.
3. **Zapisz** `data/slides/<id>.json` (id = krótki kebab-case, równy nazwie pliku). Nowa sekwencja ma `"status": "draft"`;
   `published` tylko na wyraźne polecenie Piotra. Studio (prywatne, online za hasłem) pokazuje też szkice — z dopiskiem DRAFT na liście i w HUD, bez znaku wodnego na obrazie.
4. **Sprawdź**: `node tools/sketch-slides.js data/slides/<id>.json` — wypisuje rozwinięte slajdy (pełny stan każdego) albo błędy. Popraw błędy.
5. **Zbuduj**: `node build.js` → `studio/sketch/index.html` (lokalnie, katalog w .gitignore).
6. **Pokaż Piotrowi** krótką tabelę slajdów (nr · etykieta · co się zmienia) i jak odtworzyć:
   serwer `python3 -m http.server 8763` w `studio/`, potem `http://localhost:8763/sketch/?seq=<id>&preview`
   (sprawdzone przez serwer; otwarcie pliku z `file://` powinno działać — ramka rozmawia przez postMessage — ale nie było testowane).
   Jeśli masz przeglądarkę, sam przejdź slajdy (→) i sprawdź ostrzeżenia w HUD (czerwone), zanim zgłosisz gotowe.
7. Nie commituj, dopóki Piotr nie poprosi; nigdy nie pushuj bez prośby.

## Format pliku

```json
{
  "id": "fuel-and-wall",
  "title": "Fuel mix and the glycogen wall",
  "status": "draft",
  "aspect": "16:9",
  "tween": 900,
  "slides": [
    { "topic": "1.2", "intensity": 50, "label": "Fuel mix at 50% VO₂max", "note": "Speaker note, only in the HUD." },
    { "intensity": 90 },
    { "topic": "2.3", "intensity": 75, "glycogen": "low", "gph": 0, "play": "wall" },
    { "glycogen": "loaded", "play": "wall" }
  ]
}
```

- `aspect`: `"16:9"` (domyślnie; ramka 1440 × 810, układ komputerowy szkicu) albo `"9:16"` (540 × 960, układ telefonu z arkuszami).
- `tween`: ms płynnego przejścia suwaków liczbowych między slajdami (domyślnie 900; `0` = skok). Można nadpisać w slajdzie.

### Pola slajdu

| pole | wartości | dziedziczy? |
|---|---|---|
| `topic` | numer `"1.2"`, id `"fuel"` albo pełna nazwa | tak |
| `organ` | `gut, liver, blood, lungs, kidney, adipose, muscle, mito` — prawy panel; bez pola = narząd tematu | tylko przy tym samym temacie |
| `intensity` | 5–150 (% VO₂max na poziomie morza; suwak Intensity) | tak |
| `time` | 0–300 min (suwak Time) | tak |
| `gph` | 0–120 g/h węglowodanów (krok 10) | tak |
| `comp` | `glc` glukoza · `mal` maltodekstryna · `suc` sacharoza · `gf` glukoza + fruktoza | tak |
| `glycogen` | `low` · `normal` · `loaded` (glikogen na starcie) | tak |
| `altitude` | 0–5000 m (krok 100) | tak |
| `days` | 0–70 dni na wysokości | tak |
| `acetazolamide` | `true` / `false` | tak |
| `vo2max` | 25–90 ml/kg/min | tak |
| `mass` | 40–130 kg | tak |
| `ftp` | 50–600 W (FTP zawodnika); `0` = szacunek modelu (moc przy OBLA) | tak |
| `open` | sekcje lewego panelu: numery od 1 (`[1, 3]`), fragmenty nagłówków (`["supplementation"]`) albo `"all"` | nie (brak = zamknięte) |
| `zoom` | `true` = rycina narządu na pełnym ekranie | nie |
| `play` | `true` (czas do końca osi), liczba minut, albo `"wall"` (do ściany glikogenowej); start od `time` slajdu | nie |
| `pane` | tylko 9:16: `topic` · `organ` · `settings` — otwarty arkusz telefonu | nie |
| `sources` | `true` = okno „Sources, and what is illustrative” | nie |
| `label` | etykieta w HUD (domyślnie numer i nazwa tematu) | — |
| `note` | notatka dla mówiącego, tylko w HUD (nie trafia do nagrania) | — |

Wartości domyślne szkicu (pierwszy slajd startuje od nich): intensity 65, time 0, gph 60, comp gf, glycogen normal,
altitude 0, days 0, acetazolamide false, vo2max 55, mass 70, ftp 0 (szacunek), topic 1.1.

**Zasady treści**: bez dawek i nazw handlowych w `label`/`note` (sprawdza to walidator listą z `tests/zakazane.json`);
liczby w notatkach tylko takie, które szkic już pokazuje ze źródłem. Slajd nie dodaje treści do ryciny — pokazuje jej stan.

### Tematy (stan na 2026-11-06; aktualne: `--vocab`)

1 Fuel & energy: 1.1 VO₂max & intensity · 1.2 Fuel mix · 1.3 Energy budget · 1.4 Muscle cell & mitochondrion · 1.5 Phosphocreatine & creatine · 1.6 BCAA
2 Gut, liver & glycogen: 2.1 Blood flow · 2.2 Gut absorption · 2.3 Glycogen, the wall & TTE
3 Thresholds & limits: 3.1 Lactate, LT1 & OBLA · 3.2 Breathing, thresholds & TTE
4 Altitude & heat: 4.1 Altitude & hypoxia · 4.2 Acute mountain sickness · 4.3 Acetazolamide & the kidney · 4.4 Heat & hydration
5 Training & recovery: 5.1 Training adaptations · 5.2 Recovery & refuelling · 5.3 Women & energy availability · 5.4 Supplements with evidence

Gotowe sekwencje do każdego tematu: `data/slides/t<grupa><temat>-*.json` (np. `t23-glycogen-wall.json`) — zacznij od nich, zamiast pisać od zera.

Widok PCr (prawy panel „Phosphocreatine in the muscle cell”) = temat 1.5 z narządem `mito`.
Typowe słowa Piotra: „ściana” → 2.3 + `play: "wall"`; „oddychanie / progi” → 3.2; „wysokość” → 4.1; „upał / nawodnienie / pot” → 4.4; „trening / adaptacje” → 5.1; „regeneracja” → 5.2; „kobiety / RED-S” → 5.3; „suplementy” → 5.4; „choroba wysokościowa / AMS” → 4.2;
„acetazolamid / nerka” → 4.3; „wchłanianie / jelito” → 2.2; „przepływ krwi” → 2.1; „mieszanka paliw / crossover” → 1.2.

## Ustawianie stanu ręcznie

- W szkicu ustaw wszystko myszką i naciśnij **C** — bieżący stan jako JSON slajdu trafia do schowka (i do konsoli). Wklej do `slides`.
- Adres `reference/energy-map.html#s=<JSON slajdu, URL-encoded>` otwiera szkic od razu w danym stanie.
- Z kodu: `window.HoEBMSketch.set(slajd, tweenMs)` (zwraca listę ostrzeżeń), `.get()`, `.topics()`, `.organs()`;
  z ramki rodzica: `postMessage({ hoebm: 'slide', state, tween })`, `{ hoebm: 'hold', on }`.

## Studio nagrań (rolka 9:16) — sekwencja w nagraniu

W studiu nagrań (`studio/index.html`, online `…/sports-academy/studio/` po haśle) wybierz sekwencję w panelu ROLKA.
Na scenie „animacja” **spacja / → / pilot** = następny slajd, **←** = poprzedni, a „dalej” po ostatnim slajdzie kończy nagranie
i zapisuje MP4. Szkic w studiu nagrań ma układ telefonu (ramka 500 × 515 albo 450 × 800), więc `aspect` sekwencji jest tam
pomijany, a `pane` / `zoom` mogą wyglądać inaczej niż w odtwarzaczu 16:9. Szkice sekwencji (`draft`) są na liście z dopiskiem DRAFT.

## Odtwarzacz slajdów (16:9) — klawisze

← → slajd (PageUp/PageDown z pilota też) · **R** albo klik w ramkę: restart od slajdu 1 z czystą klatką 1,5 s ·
**Space** pauza (przejścia i odtwarzanie czasu) · **S** strefa bezpieczna (16:9: 5% marginesu; 9:16: strefa Reels jak w studiu rycin) ·
**F** pełny ekran · **H** pomoc / HUD. Bez `?seq=` HUD pokazuje listę sekwencji. Szkice (`draft`) z dopiskiem DRAFT w HUD.
