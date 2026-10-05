/* Every form the Document Drafting page can open.
   To add a form: drop its script in this folder (see mc200a.js) and add one line here.
   id      the hash in the page address (#mc200a) and the script name (mc200a.js)
   number  the form number printed on the form; saved .md files carry it as "form: MC 200A" */
export const FORMS = [
  { id: 'mc02', number: 'MC 02', title: 'Appearance', group: 'General',
    summary: 'An attorney enters an appearance as counsel of record for one or more parties.' },
  { id: 'mc200a', number: 'MC 200A', title: 'Criminal Complaint and Affidavit of Probable Cause', group: 'Criminal',
    summary: 'The complaint, order page, and affidavit of probable cause as one packet. Add as many counts as you need.' }
];
export const keyOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const byId = id => FORMS.find(f => f.id === keyOf(id));
export const byNumber = n => FORMS.find(f => keyOf(f.number) === keyOf(n));