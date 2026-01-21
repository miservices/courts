// AUTH GUARD
if (sessionStorage.getItem("staffAuth") !== "true") {
  location.href = "staff-login.html";
}

// PARTY TOGGLE
party.addEventListener("change", () => {
  otherPartyWrap.style.display = party.value === "Other" ? "block" : "none";
});

const FORM_BASE =
"https://docs.google.com/forms/d/e/1FAIpQLSd7z_NTRHAhaVVUAG3ER2Ltce2J-0q7dx3sUqqBlDaEZRyaAw/formResponse";

function v(x) { return encodeURIComponent(x && x.trim() ? x.trim() : "NADNS"); }

function submitUpdate() {
  const cn = v(caseNo.value);
  const dt = v(eventDate.value);
  const pt = party.value === "Other" ? v(otherParty.value) : v(party.value);
  const jd = v(judge.value);
  const ds = v(desc.value);

  if (!caseNo.value || !eventDate.value || !desc.value) {
    status.textContent = "Required fields missing.";
    return;
  }

  const url =
    `${FORM_BASE}?` +
    `entry.1246407252=${cn}` +
    `&entry.211192701=${dt}` +
    `&entry.1552263291=__other_option__` +
    `&entry.1552263291.other_option_response=${pt}` +
    `&entry.1933078191=__other_option__` +
    `&entry.1933078191.other_option_response=${jd}` +
    `&entry.1124117797=${ds}`;

  fetch(url, { mode: "no-cors" });

  status.textContent = "Update submitted successfully.";

  caseNo.value = "";
  desc.value = "";
}
