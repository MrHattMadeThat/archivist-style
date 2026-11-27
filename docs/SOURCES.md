# Sources for the source desk

The desk is in Saint John in 1910, so every paper on it is a real source that existed by then. Copies of the texts
used are in `docs/source-texts/`.

## Samuel de Champlain, *Les Voyages* (Paris, 1613)

- Passages, the 1878 English (C. P. Otis) and the 1613 French (Laverdière's 1870 printing) come from The Archive
  Desk (`../archive-desk/src/units/acadie-1/sources.js`), which took them from Acadie's checked sources (checked
  2026-11-19, see `../acadie/docs/SOURCES.md`). Generated into `js/desk/champlain.js`.
- Page scans: McGill University Library, Lande collection, via the Internet Archive
  (https://archive.org/details/McGillLibrary-rbsc_lande_00116_c2-19950). Public domain. Copied to `sources/`.

## Francis Parkman, *Pioneers of France in the New World*, chapter 3, "Acadia Occupied"

- Text: the Project Gutenberg e-text (pofnw10.txt), via the Internet Archive:
  https://archive.org/details/pioneersoffrance03721gut. The excerpt used is in
  `docs/source-texts/parkman-1865-ch3-excerpt.txt`.
- Date: the preface is signed "Boston. January 1, 1865." The e-text may be from a later printing.
- Note: Parkman says Pontgravé arrived on 16 June 1605. The U.S. National Park Service says 15 June. A good
  "two sources disagree" task for later.

## W. F. Ganong, *Dochet (St. Croix) Island: A Monograph* (1902)

- From the Transactions of the Royal Society of Canada, 1902 (read 27 May 1902). Ottawa: J. Hope & Sons; Toronto:
  Copp-Clark. Scan (CIHM 74303) via the Internet Archive: https://archive.org/details/cihm_74303. The OCR text is in
  `docs/source-texts/ganong-1902-dochet-island.txt` (OCR errors fixed by hand in the passages used).
- "Why the French left the island": Ganong's own argument (pages 188–189 of the Transactions; around lines 679–705
  and 846–858 of the OCR text).
- "The island in Ganong's day": a footnote to his reprint of Champlain's account of the sickness (around line 2632
  of the OCR text). One sentence after "He thought them remains of the French settlers" is left out on purpose.

## George Stewart, Jr., *The Story of the Great Fire in St. John, N.B., June 20th, 1877* (Toronto, 1877)

- The guided sample's paper. Stewart signs the book "of St. John, N.B."; copyright entered in 1877.
- Text: the Project Gutenberg e-text (39260), via the Internet Archive:
  https://archive.org/details/thestoryofthegre39260gut. Chapter 1's opening and the title page are in
  `docs/source-texts/stewart-1877-ch1-excerpt.txt`.
- The chapter's second paragraph is about the first fire, in 1784: the same book is secondary for a question about
  1784. Mr. Harrow points this out.

## Marc Lescarbot, *Histoire de la Nouvelle-France* (Paris, 1609; the 1612 edition)

- Not on the island: Ganong says Lescarbot came to Acadia two years later and got his facts from Champlain and the men
  at Port Royal. That is the point of chapter 2.
- Text: Ganong 1902 prints the 1612 edition's French and his own English translation. "What Lescarbot thought of the
  island" (pp. 460–462 of the 1612 edition) is retold from the French (OCR around lines 2960–2990 of the Ganong text;
  the English there has OCR gaps). "A winter he heard about" (pp. 477–479) uses Ganong's English (around lines
  3632–3650 and 3720–3733). Lescarbot says 36 died; Champlain says 35.
- The 1609 English translation (Erondelle, *Nova Francia*) exists too; it is not used.

## Robert Pagan's deposition (sworn at St. Andrews, 20 July 1797)

- Text: W. H. Kilby, *Eastport and Passamaquoddy* (Eastport, Maine: Edward E. Shead & Co., 1888), pp. 124–125,
  https://archive.org/details/eastportpassamaq00kilb. The excerpt is in
  `docs/source-texts/kilby-1888-boundary-excerpt.txt`. Ganong 1902 prints it too (from the Boundary Commission
  manuscript), but his OCR has gaps; Kilby's is complete. The two agree where both are legible.
- The last line ("Signed by Robert Pagan, and sworn at St. Andrews…") is Kilby's note; Ganong's printing has the
  signature and the justice's oath, so it is in the deposition.

## Thomas Wright's depositions (sworn at St. Andrews, 24 October 1797)

- Text: Ganong 1902, pp. 202–204 (OCR around lines 4665–4830), "now published for the first time from the Ms. in the
  records of the Boundary Commission". Kilby 1888 (pp. 125–126) summarises the same survey.

## Ganong on the boundary (1902)

- "Which river is the St. Croix?": pp. 198–200 (OCR around lines 4466–4590). "How much did the island matter?":
  pp. 208–210 (around lines 4990–5070), including his judgement that the island did not decide the border alone.
- The decision of 25 October 1798 is also in Kilby (p. 54, in the chapter reprinting Weston's history).
- Not used yet: Kilby/Weston say the commission first met at Halifax in September 1796; Ganong says St. Andrews in
  August 1796. Another "two sources disagree" task for later.

## The morning paper: *The Standard*, Saint John, Wednesday 18 May 1910, page 1

- Library and Archives Canada microfilm, via Canadiana: https://www.canadiana.ca/view/oocihm.N_00384_19100518 (the
  IIIF image service, image `69429/c0tm71z4c31v`). The scan in `sources/standard-1910-05-18-p1.jpg` is that page,
  cropped to the paper, 2000 px wide. Public domain.
- Set in type in `js/desk/paper.js`, word for word: "Prof. Blake on the Comet" (whole); "Comet Works Destruction at
  Portland" (cut: the grim items, and a paragraph about New Orleans written in the racist language of the day, are
  left out and marked […]); "Shower of Meteors"; and the headlines and first lines of "London Wrapped in Silent
  Grief", "All Work on C.P.R. Ceases", "Dr. Cook Said to Have Been in New York" and "Commander Peary Honored in
  Vienna". The scan tab shows the whole page as printed.
- Not used yet: the Cook/Peary North Pole dispute on the same page ("A. S. Cheeseborough in St. John last week…"), a
  ready-made "who was in a position to know" case.

## Saint John in 1910: the places and the talk

- **Halley's comet**: the Earth passed through the tail on the night of 18 May 1910 (Prof. Blake, the Standard, above).
  Comet pills: "Comet pills would find a ready sale here" (same page). The comet was beside the sun that night, so
  nothing could be seen.
- **King Edward VII** died on 6 May 1910; the funeral was on Friday 20 May ("All Work on C.P.R. Ceases", same page).
- **King Square**: set aside in 1785, named for George III; paths laid out in the Union Jack pattern in the 1840s
  (sources give 1844 and 1847, so the card says "the 1840s"); the bandstand built in 1908 by the architect Neil Brodie
  for the City Cornet Band, iron-framed with a copper roof, now called the King Edward VII Memorial Bandstand.
  https://en.wikipedia.org/wiki/King%27s_Square,_Saint_John and the Historical Marker Database,
  https://www.hmdb.org/m.asp?m=77531.
- **The Loyalist Burial Ground**: laid out in 1783, bounded by Sydney, Union and Carmarthen Streets and King Street
  East, beside King Square; oldest stone 1784 (Conradt Hendricks); closed to burials in 1848.
  https://en.wikipedia.org/wiki/Loyalist_Burial_Ground
- **The foghorn**: Robert Foulis's steam fog alarm, installed on Partridge Island in 1859, the first of its kind.
  https://www.thecanadianencyclopedia.ca/en/article/robert-foulis
- **The tides and the Reversing Falls**: the cabman's "higher than a house" for the harbour's tide, and the river
  running backwards at the falls, are both true of Saint John.
- **Guesses** (no source describes them): Mrs. Hanlon's house and its number, the trees' places, the lamps and benches
  in the square, the people in the crowd and what they say, the train (typical of the period, not a particular one).

## Invented (and labelled as such in README.md)

- Mr. Harrow, the attendant (Miss Doucet), Miss Agnes Lyle, her pupil Tom Nason, Mr. Silas Mott the newspaperman,
  Percy Gage the pill seller, Mrs. Hanlon and her boarding house, the cabman, the townsfolk, Mr. Tull and his card, the offices and
  the stacks, the archive boxes' labels, and every
  "mail" consequence in the end-of-case reports.
