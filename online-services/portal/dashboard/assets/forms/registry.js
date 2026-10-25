/* Every form the Document Drafting page can open.
   To add a form: drop its script in this folder (see mc200a.js) and add one line here.
   id      the hash in the page address (#mc200a) and the script name (mc200a.js)
   number  the form number printed on the form; saved .md files carry it as "form: MC 200A" */
export const FORMS = [
  { id: 'mc02', number: 'MC 02', title: 'Appearance', group: 'General',
    summary: 'An attorney enters an appearance as counsel of record for one or more parties.' },
  { id: 'mc200a', number: 'MC 200A', title: 'Criminal Complaint and Affidavit of Probable Cause', group: 'Criminal',
    summary: 'The complaint, order page, and affidavit of probable cause as one packet. Add as many counts as you need.' },
  { id: 'plead1', number: 'Pleading 1', title: 'General Pleading (Style 1)', group: 'Pleadings',
    summary: 'Parties on the left, judge and case number on the right, with one rule under the caption.' },
  { id: 'plead2', number: 'Pleading 2', title: 'General Pleading (Style 2)', group: 'Pleadings',
    summary: 'Pleading name, judge and case number on the right, with rules above and below the parties.' },
  { id: 'plead3', number: 'Pleading 3', title: 'General Pleading (Style 3)', group: 'Pleadings',
    summary: 'Pleading name, judge and case number on the right, with a closing line under the parties.' },
  { id: 'plead4', number: 'Pleading 4', title: 'General Pleading (Style 4)', group: 'Pleadings',
    summary: 'Parties with a rule below and a column of parentheses beside them.' },
  { id: 'plead5', number: 'Pleading 5', title: 'General Pleading (Style 5)', group: 'Pleadings',
    summary: 'Parties set between two rules with a column of parentheses, and the court heading set left.' }
];
export const keyOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const byId = id => FORMS.find(f => f.id === keyOf(id));
export const byNumber = n => FORMS.find(f => keyOf(f.number) === keyOf(n));