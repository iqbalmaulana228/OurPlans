/* OurPlans full feature layer. Kept separate from the original SPA to make upgrades safer. */
(function () {
  const themes = ["sage", "ocean", "rose", "lavender"];
  const defaultMenu = {
    starters: [{name:"Welcome bites",description:"A selection of light starters"}],
    mains: [{name:"Chef's special",description:"Main course details to be confirmed"}],
    desserts: [{name:"Wedding cake",description:"A sweet ending to the celebration"}]
  };
  const makeId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : "op-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  const text = (v, max = 240) => String(v == null ? "" : v).slice(0, max);
  const safe = (v) => typeof esc === "function" ? esc(v) : text(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const byId = id => document.getElementById(id);
  function normalize() {
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.expenses = Array.isArray(state.expenses) ? state.expenses : [];
    state.guests = Array.isArray(state.guests) ? state.guests : [];
    state.vendors = Array.isArray(state.vendors) ? state.vendors : [];
    state.timeline = Array.isArray(state.timeline) ? state.timeline : [];
    state.seating = Array.isArray(state.seating) ? state.seating : [];
    state.palette = Array.isArray(state.palette) ? state.palette : [];
    state.beauty = Array.isArray(state.beauty) ? state.beauty : [];
    state.gallery = Array.isArray(state.gallery) ? state.gallery : [];
    state.menu = state.menu || JSON.parse(JSON.stringify(defaultMenu));
    ["starters","mains","desserts"].forEach(k => { state.menu[k] = Array.isArray(state.menu[k]) ? state.menu[k] : []; });
    state.publicId = state.publicId || makeId();
    state.theme = themes.includes(state.theme) ? state.theme : "sage";
    state.bride = state.bride || "";
    state.groom = state.groom || "";
    state.venue = state.venue || "";
    state.address = state.address || "";
    state.ceremony = state.ceremony || "";
    state.reception = state.reception || "";
    state.guests.forEach(g => { g.inviteToken = g.inviteToken || makeId(); g.diet = g.diet || ""; g.table = g.table || ""; g.gift = g.gift || ""; });
    state.vendors.forEach(v => { v.rating = Number(v.rating || 0); v.email = v.email || ""; v.location = v.location || ""; v.website = v.website || ""; v.description = v.description || ""; });
    state.expenses.forEach(e => { if (typeof e.paid !== "number") e.paid = e.status === "Paid" ? Number(e.amount || 0) : 0; e.paid = Math.min(Number(e.amount || 0), Math.max(0, Number(e.paid || 0))); });
    state.timeline.forEach(t => { t.location = t.location || ""; });
    try { localStorage.setItem("ourplans", JSON.stringify(state)); } catch (e) { console.warn("Could not normalize local wedding data", e); }
  }
  normalize();

  const baseRender = render;
  render = function () {
    normalize();
    baseRender();
    renderExtended();
  };

  function setTheme(theme) {
    if (!themes.includes(theme)) theme = "sage";
    state.theme = theme;
    document.body.classList.remove("theme-ocean", "theme-rose", "theme-lavender");
    if (theme !== "sage") document.body.classList.add("theme-" + theme);
    if (byId("themeSelect")) byId("themeSelect").value = theme;
    try { localStorage.setItem("ourplans", JSON.stringify(state)); } catch {}
  }
  window.setTheme = setTheme;

  go = function (page) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("show"));
    const selected = byId(page);
    if (selected) selected.classList.add("show");
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
    const titles = {dashboard:"The overview",checklist:"Wedding checklist",budget:"Budget planner",guests:"Guest list",blasting:"WhatsApp Invitation Center",vendors:"Vendor directory",schedule:"Wedding timeline",seating:"Seating chart",inspiration:"Wedding style",beauty:"Beauty preparation",gallery:"Inspiration gallery",ai:"AI wedding planner",menu:"Wedding menu",settings:"Wedding settings"};
    if (byId("pageTitle")) byId("pageTitle").textContent = titles[page] || "OurPlans";
    if (page === "settings") renderExtended();
  };

  addExpense = function () {
    const name = byId("expenseName").value.trim(), amount = Number(byId("expenseAmount").value || 0);
    if (!name || amount <= 0) return;
    const status = byId("expenseStatus").value;
    let paid = Number(byId("expensePaid").value || 0);
    if (!byId("expensePaid").value && status === "Paid") paid = amount;
    state.expenses.push({ id: Date.now(), name, amount, paid: Math.min(amount, Math.max(0, paid)), status });
    ["expenseName","expenseAmount","expensePaid"].forEach(id => { if (byId(id)) byId(id).value = ""; });
    save();
  };
  addGuest = function () {
    const name = byId("guestName").value.trim();
    if (!name) return;
    state.guests.push({
      id: Date.now(), name, phone: byId("guestPhone").value.trim(), group: byId("guestGroup").value.trim(),
      diet: byId("guestDiet").value.trim(), table: byId("guestTable").value.trim(), gift: byId("guestGift").value.trim(),
      rsvp: byId("guestRSVP").value, inviteToken: makeId()
    });
    ["guestName","guestPhone","guestGroup","guestDiet","guestTable","guestGift"].forEach(id => { if (byId(id)) byId(id).value = ""; });
    save();
  };
  addVendor = function () {
    const name = byId("vendorName").value.trim();
    if (!name) return;
    state.vendors.push({
      id: Date.now(), name, type: byId("vendorType").value.trim(), price: Number(byId("vendorPrice").value || 0),
      contact: byId("vendorContact").value.trim(), email: byId("vendorEmail").value.trim(), location: byId("vendorLocation").value.trim(),
      rating: Math.max(0, Math.min(5, Number(byId("vendorRating").value || 0))), website: byId("vendorWebsite").value.trim(),
      description: byId("vendorDescription").value.trim(), status: byId("vendorStatus").value
    });
    ["vendorName","vendorType","vendorPrice","vendorContact","vendorEmail","vendorLocation","vendorRating","vendorWebsite","vendorDescription"].forEach(id => { if (byId(id)) byId(id).value = ""; });
    save();
  };
  addTimeline = function () {
    const time = byId("timeInput").value, event = byId("eventInput").value.trim();
    if (!time || !event) return;
    state.timeline.push({ id: Date.now(), time, event, location: byId("timeLocation").value.trim(), person: byId("timePerson").value.trim() });
    byId("eventInput").value = ""; byId("timeLocation").value = "";
    save();
  };
  assignSeat = function () {
    const table = byId("tableInput").value.trim(), name = byId("seatGuest").value.trim();
    if (!table || !name) return;
    const guest = state.guests.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (guest) guest.table = table;
    state.seating = state.seating.filter(s => s.name.toLowerCase() !== name.toLowerCase());
    state.seating.push({ id: Date.now(), table, name });
    byId("seatGuest").value = "";
    save();
  };
  rsvp = function (id, value) {
    const guest = state.guests.find(g => String(g.id) === String(id));
    if (!guest) return;
    guest.rsvp = value; save();
  };
  guestLink = function (guest) {
    const link = new URL("guest.html", location.href);
    link.searchParams.set("id", state.publicId);
    link.searchParams.set("guest", guest.name);
    link.searchParams.set("token", guest.inviteToken || "");
    return link.href;
  };

  function renderExtended() {
    setTheme(state.theme);
    const yes = state.guests.filter(g => ["Yes","Hadir","Accepted","accepted"].includes(g.rsvp)).length;
    const no = state.guests.filter(g => ["No","Tidak hadir","Declined","declined"].includes(g.rsvp)).length;
    const pending = Math.max(0, state.guests.length - yes - no);
    if (byId("rsvpSummary")) byId("rsvpSummary").innerHTML = '<span>✓ ' + yes + ' confirmed</span><span>◷ ' + pending + ' pending</span><span>× ' + no + ' declined</span><span>' + state.guests.length + ' invited</span>';

    const total = state.expenses.reduce((n, e) => n + Number(e.amount || 0), 0);
    const paid = state.expenses.reduce((n, e) => n + Number(e.paid || 0), 0);
    if (byId("paidTotal")) byId("paidTotal").textContent = money(paid);
    if (byId("dueTotal")) byId("dueTotal").textContent = money(Math.max(0, total - paid));
    if (byId("expenseTable")) byId("expenseTable").innerHTML = state.expenses.map(e => '<tr><td>' + safe(e.name) + '</td><td>' + money(e.amount) + '</td><td>' + money(e.paid) + '</td><td>' + money(Math.max(0,e.amount-e.paid)) + '</td><td>' + safe(e.status) + '</td><td><button class="btn light" onclick="del(\'expenses\',' + e.id + ')">×</button></td></tr>').join("");

    if (byId("guestTable")) byId("guestTable").innerHTML = state.guests.map(g => {
      const link = guestLink(g), status = ["Yes","Hadir","Accepted","accepted"].includes(g.rsvp) ? "Yes" : (["No","Tidak hadir","Declined","declined"].includes(g.rsvp) ? "No" : "Pending");
      return '<tr><td><b>' + safe(g.name) + '</b><br><small>' + safe(g.gift || "") + '</small></td><td>' + safe(g.phone || "") + '</td><td>' + safe(g.group || "") + '</td><td>' + safe(g.diet || "None") + '</td><td>' + safe(g.table || "—") + '</td><td><select onchange="rsvp(' + g.id + ',this.value)"><option ' + (status === "Pending" ? "selected" : "") + '>Pending</option><option ' + (status === "Yes" ? "selected" : "") + '>Yes</option><option ' + (status === "No" ? "selected" : "") + '>No</option></select></td><td><button class="btn light" onclick="copyInvitation(\'' + encodeURIComponent(link) + '\')">Copy portal link</button></td><td><button class="btn light" onclick="del(\'guests\',' + g.id + ')">×</button></td></tr>';
    }).join("");

    if (byId("vendorCards")) byId("vendorCards").innerHTML = state.vendors.map(v => '<article class="vendorcard"><div class="row"><span class="tag">' + safe(v.type || "Vendor") + '</span><span class="rating">' + (v.rating ? "★ " + v.rating.toFixed(1) + "/5" : "Not rated") + '</span></div><h4>' + safe(v.name) + '</h4><p>' + safe(v.description || "No service description yet.") + '</p><p>' + safe(v.location || "Location not specified") + '</p><div class="row"><b>' + money(v.price) + '</b><button class="btn light" onclick="showVendor(' + v.id + ')">View details</button></div></article>').join("");
    if (byId("vendorTable")) byId("vendorTable").innerHTML = state.vendors.map(v => '<tr><td>' + safe(v.name) + '</td><td>' + safe(v.type) + '</td><td>' + money(v.price) + '</td><td>' + safe(v.contact) + '</td><td>' + (v.rating ? "★ " + v.rating.toFixed(1) : "—") + '</td><td>' + safe(v.status) + '</td><td><button class="btn light" onclick="del(\'vendors\',' + v.id + ')">×</button></td></tr>').join("");

    if (byId("seatList")) {
      const grouped = {};
      state.guests.filter(g => g.table).forEach(g => { (grouped[g.table] = grouped[g.table] || []).push(g.name); });
      byId("seatList").innerHTML = Object.keys(grouped).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})).map(t => '<div class="listrow"><b>Table ' + safe(t) + '</b><div class="guestNames">' + grouped[t].map(n => '<span>' + safe(n) + '</span>').join("") + '</div></div>').join("") || '<div class="empty">Assign a table to a guest to build the seating chart.</div>';
    }

    if (byId("menuList")) byId("menuList").innerHTML = ["starters","mains","desserts"].map(k => '<div class="panel" style="margin:12px 0;background:#faf8f4"><h3>' + k[0].toUpperCase() + k.slice(1) + '</h3>' + state.menu[k].map((m,i) => '<div class="menuitem"><div><b>' + safe(m.name) + '</b><div class="footnote">' + safe(m.description || "") + '</div></div><button class="btn light" onclick="removeMenuItem(\'' + k + '\',' + i + ')">×</button></div>').join("") + '</div>').join("");

    if (byId("portalUrl")) byId("portalUrl").value = publicPortalUrl();
    if (byId("portalStatus")) byId("portalStatus").textContent = state.portalPublishedAt ? "Last published: " + new Date(state.portalPublishedAt).toLocaleString("id-ID") : "Portal ID generated. Publish after configuring Supabase.";
    const fields = {settingCouple:"couple",settingBride:"bride",settingGroom:"groom",settingDate:"date",settingVenue:"venue",settingAddress:"address",settingCeremony:"ceremony",settingReception:"reception"};
    Object.keys(fields).forEach(id => { const el = byId(id); if (el && document.activeElement !== el) el.value = state[fields[id]] || ""; });
    if (byId("themeSelect")) byId("themeSelect").value = state.theme;
    renderSeatSearch();
  }
  window.renderExtended = renderExtended;

  function renderSeatSearch() {
    const target = byId("seatSearchResults");
    if (!target) return;
    const q = (byId("seatSearch")?.value || "").trim().toLowerCase();
    if (!q) { target.innerHTML = ""; return; }
    const matches = state.guests.filter(g => g.name.toLowerCase().includes(q) || String(g.table || "").toLowerCase().includes(q));
    target.innerHTML = matches.map(g => {
      const tablemates = state.guests.filter(x => g.table && x.table && String(x.table) === String(g.table));
      return '<div class="card" style="margin:8px 0"><b>' + safe(g.name) + '</b><div class="stat">' + (g.table ? "Table " + safe(g.table) : "Not assigned") + '</div><div class="guestNames">' + tablemates.map(x => '<span>' + safe(x.name) + '</span>').join("") + '</div></div>';
    }).join("") || '<div class="empty">No matching guests.</div>';
  }
  window.renderSeatSearch = renderSeatSearch;

  function publicPortalUrl() {
    const u = new URL("guest.html", location.href); u.searchParams.set("id", state.publicId); return u.href;
  }
  window.openGuestPortal = function (guest) {
    const url = guest ? guestLink(guest) : publicPortalUrl();
    window.open(url, "_blank", "noopener");
  };
  window.copyPortalLink = function () {
    const url = publicPortalUrl();
    navigator.clipboard?.writeText(url).then(() => toast("Guest portal link copied")).catch(() => toast(url));
  };
  window.saveWeddingDetails = function () {
    state.couple = byId("settingCouple").value.trim() || "Our Wedding Day";
    state.bride = byId("settingBride").value.trim(); state.groom = byId("settingGroom").value.trim();
    state.date = byId("settingDate").value; state.venue = byId("settingVenue").value.trim();
    state.address = byId("settingAddress").value.trim(); state.ceremony = byId("settingCeremony").value.trim(); state.reception = byId("settingReception").value.trim();
    save(); toast("Wedding details saved");
  };
  window.addMenuItem = function () {
    const category = byId("menuCategory").value, name = byId("menuName").value.trim();
    if (!name) return;
    state.menu[category].push({name, description:byId("menuDescription").value.trim()});
    byId("menuName").value = ""; byId("menuDescription").value = ""; save();
  };
  window.removeMenuItem = function (category, index) { state.menu[category].splice(index,1); save(); };
  window.showVendor = function (id) {
    const v = state.vendors.find(x => String(x.id) === String(id)); if (!v) return;
    byId("vendorDialogTitle").textContent = v.name;
    byId("vendorDialogBody").innerHTML = '<p class="tag">' + safe(v.type) + ' · ' + safe(v.status) + '</p><h2 style="font:24px Playfair Display">' + money(v.price) + '</h2><p>' + safe(v.description || "No description") + '</p><p>Rating: ' + (v.rating || "Not rated") + '/5</p><p>Contact: ' + safe(v.contact) + '</p><p>Email: ' + safe(v.email) + '</p><p>Location: ' + safe(v.location) + '</p><p>Website: ' + safe(v.website) + '</p>';
    byId("vendorDialog").classList.add("open");
  };

  window.generateAI = async function () {
    const button = byId("aiGenerateBtn"), output = byId("aiResult");
    button.disabled = true; button.textContent = "Analysing…"; output.innerHTML = '<div class="airesult">Generating a tailored palette…</div>';
    try {
      const r = await fetch("/api/ai", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        action:"palette", theme:byId("aiTheme").value, skinTone:byId("aiSkin").value, hairColor:byId("aiHair").value,
        eyeColor:byId("aiEyes").value, preferences:byId("aiPrefs").value, avoids:byId("aiAvoids").value
      })});
      const result = await r.json(); if (!r.ok) throw new Error(result.error || "AI request failed");
      state.aiSuggestions = result; renderAI(); 
    } catch (e) { output.innerHTML = '<div class="airesult">' + safe(e.message) + '</div>'; }
    finally { button.disabled = false; button.textContent = "Generate color analysis"; }
  };
  function renderAI() {
    const result = state.aiSuggestions, output = byId("aiResult"); if (!result || !output) return;
    output.innerHTML = '<div class="airesult"><h4>' + safe(result.season || "Suggested color season") + '</h4><p>' + safe(result.analysis || "") + '</p>' + (result.palette || []).map((p,i) => '<div class="colorchip"><i style="background:' + safe(p.hex) + '"></i><div style="flex:1"><b>' + safe(p.name) + '</b><div class="footnote">' + safe(p.hex) + ' · ' + safe(p.reason) + '</div></div><button class="btn light" onclick="addAiColor(' + i + ')">Add to palette</button></div>').join("") + '</div>';
  }
  window.addAiColor = function (i) {
    const p = state.aiSuggestions?.palette?.[i]; if (!p) return;
    if (!state.palette.some(x => x.hex.toLowerCase() === p.hex.toLowerCase())) state.palette.push({name:p.name,hex:p.hex});
    save(); go("inspiration"); toast("Color added to wedding palette");
  };
  window.generateWisdom = async function () {
    const el = byId("wisdomResult"); el.textContent = "Thinking through one useful next step…";
    try { const r = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"wisdom"})}); const j = await r.json(); if(!r.ok) throw new Error(j.error || "AI request failed"); el.textContent = j.text; }
    catch(e) { el.textContent = e.message; }
  };

  window.publishGuestPortal = async function () {
    if (typeof cloudClient === "undefined" || !cloudClient) { toast("Configure Supabase login first. See Supabase setup instructions."); return; }
    const sessionResult = await cloudClient.auth.getSession();
    const session = sessionResult?.data?.session;
    if (!session?.access_token) { toast("Login via OurPlans Cloud before publishing."); byId("cloudPanel").style.display = "block"; return; }
    normalize();
    state.guests.forEach(g => { g.inviteToken = g.inviteToken || makeId(); });
    const payload = {
      couple:state.couple, bride:state.bride, groom:state.groom, date:state.date, venue:state.venue, address:state.address,
      ceremony:state.ceremony, reception:state.reception, timeline:state.timeline, menu:state.menu,
      guests:state.guests.map(g => ({name:g.name,table:g.table,inviteToken:g.inviteToken,rsvp:g.rsvp,message:g.message || ""})),
      gallery:state.gallery.filter(g => /^https:\\/\\//i.test(g.url || "")).map(g => ({id:g.id,url:g.url,caption:g.caption}))
    };
    const status = byId("portalStatus"); if (status) status.textContent = "Publishing guest portal…";
    try {
      const r = await fetch("/api/guest",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer " + session.access_token},body:JSON.stringify({action:"publish",weddingId:state.publicId,payload})});
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Publish failed");
      state.portalPublishedAt = Date.now(); localStorage.setItem("ourplans",JSON.stringify(state)); renderExtended();
      toast("Guest portal published"); if (status) status.textContent = "Published successfully. Share the link with your guests.";
    } catch(e) { if (status) status.textContent = e.message; toast(e.message); }
  };

  window.refreshGuestPortal = async function () {
    try {
      const r = await fetch("/api/guest?id=" + encodeURIComponent(state.publicId));
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Unable to load guest portal");
      const publicGuests = j.payload?.guests || [];
      publicGuests.forEach(pg => {
        const guest = state.guests.find(g => g.inviteToken && g.inviteToken === pg.inviteToken);
        if (guest) { guest.rsvp = pg.rsvp || guest.rsvp; guest.message = pg.message || guest.message; }
      });
      const existing = new Set(state.gallery.map(g => String(g.id)));
      (j.payload?.gallery || []).forEach(g => { if (!existing.has(String(g.id))) state.gallery.push(g); });
      save(); toast("Latest guest RSVPs and shared photos imported");
    } catch(e) { toast(e.message); }
  };

  // Keep the public portal URL personal in WhatsApp messages and per-guest copy actions.
  normalize();
  setTheme(state.theme);
  const oldCloudLoad = window.cloudLoad;
  if (typeof oldCloudLoad === "function") {
    window.cloudLoad = async function () { await oldCloudLoad(); normalize(); render(); };
  }
  const oldCloudSync = window.cloudSync;
  if (typeof oldCloudSync === "function") {
    // The existing Cloud sync remains the owner workspace backup.
  }
  render();
})();