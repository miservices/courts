/* Every form the Document Drafting page can open.
   To add a form: drop its script in this folder (see mc200a.js) and add one line here.
   id      the hash in the page address (#mc200a) and the script name (mc200a.js)
   number  the form number printed on the form; saved .md files carry it as "form: MC 200A" */
export const FORMS = [
  { id: 'mc02', number: 'MC 02', title: 'Appearance', group: 'General',
    summary: 'An attorney enters an appearance as counsel of record for one or more parties.' },
  { id: 'mc200a', number: 'MC 200', title: 'Criminal Complaint Packet', group: 'Criminal',
    summary: 'The complaint, order page, and affidavit of probable cause as one packet. Add as many counts as you need.' },
  { id: 'mc240', number: 'MC 240', title: 'Arraignment Order Packet', group: 'Criminal',
    summary: 'The court’s order after arraignment with the pretrial release order (bond, release conditions, denial of bail). Completed by the judge, magistrate, or court staff.' },
  { id: 'mc240a', number: 'MC 240A', title: 'Order After Arraignment', group: 'Criminal',
    summary: 'The court’s order after arraignment on its own: advisements, plea, and the next proceeding. Completed by the judge, magistrate, or court staff.' },
  { id: 'mc240b', number: 'MC 240B', title: 'Pretrial Release Order', group: 'Criminal',
    summary: 'The pretrial release order on its own, with an Amended box: release type, bond, terms and conditions, and denial of bail. Completed by the judge, magistrate, or court staff.' },
  { id: 'mc241', number: 'MC 241', title: 'Order After Preliminary Examination', group: 'Criminal',
    summary: 'The court’s findings and order after a preliminary examination: probable cause by charge, bind over, dismissals, amendments, and bail. Completed by the judge, magistrate, or court staff.' },
  { id: 'mc500', number: 'MC 500', title: 'Request for Certified Court Records Copies', group: 'General',
    summary: 'A request for certified copies of documents, docket entries, or opinions, with the court’s response, fees, and receipt number. Records Requests fills it in automatically.' }
];
export const keyOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const byId = id => FORMS.find(f => f.id === keyOf(id));
export const byNumber = n => FORMS.find(f => keyOf(f.number) === keyOf(keyOf(n) === 'mc200a' ? 'MC 200' : n));