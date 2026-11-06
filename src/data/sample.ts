import type { Recipient } from '../types';

// Invented names with real Eastern Swiss towns, for demos and user tests.
const FIRST = ['Anna', 'Luca', 'Sara', 'Noah', 'Lea', 'Elias', 'Mia', 'Jan', 'Laura', 'Nico', 'Lena', 'David', 'Julia', 'Fabian', 'Chiara', 'Simon', 'Nina', 'Leon', 'Elena', 'Tim', 'Alina', 'Matteo', 'Selina', 'Jonas', 'Lara', 'Robin', 'Sophie', 'Levin', 'Jana', 'Dario'];
const LAST = ['Keller', 'Baumann', 'Frei', 'Huber', 'Brunner', 'Gerber', 'Schmid', 'Meier', 'Steiner', 'Fischer', 'Weber', 'Moser', 'Zürcher', 'Graf', 'Wyss', 'Roth', 'Kessler', 'Hofer', 'Egli', 'Kaufmann', 'Suter', 'Bachmann', 'Lüthi', 'Widmer', 'Koch', 'Arnold', 'Marti', 'Ammann', 'Rüegg', 'Signer'];
const STREETS = ['Bahnhofstrasse', 'Hauptstrasse', 'Kirchgasse', 'Rosenweg', 'Lindenstrasse', 'Dorfstrasse', 'Säntisstrasse', 'Bergstrasse', 'Seestrasse', 'Wiesenweg', 'Schulstrasse', 'Gartenstrasse', 'Poststrasse', 'Blumenweg', 'Feldstrasse'];
const TOWNS: [string, string][] = [
  ['9000', 'St. Gallen'],
  ['9500', 'Wil'],
  ['8570', 'Weinfelden'],
  ['8500', 'Frauenfeld'],
  ['9200', 'Gossau'],
  ['9240', 'Uzwil'],
  ['9300', 'Wittenbach'],
  ['9400', 'Rorschach'],
  ['8280', 'Kreuzlingen'],
  ['9100', 'Herisau'],
  ['9230', 'Flawil'],
  ['9015', 'St. Gallen'],
];

export const SAMPLE_RECIPIENTS: Recipient[] = FIRST.map((first, i) => {
  const [plz, city] = TOWNS[(i * 5) % TOWNS.length];
  return { first, last: LAST[i], street: `${STREETS[(i * 7) % STREETS.length]} ${((i * 13) % 47) + 1}`, plz, city };
});

export const SAMPLE_LIST_NAME = 'Lehrabschluss 2026 (example data)';
