(function () {
  var API = "https://script.google.com/macros/s/AKfycbxPKc8eFlV-DBLdbW6fSZAGYYEi6YKobQjX5OpHShAw_T2zKZ_S5BGp9U_kUnHPmmRX/exec";
  var W = window, doc = document, nav = navigator;
  if (W.CDDL_TRACK) return;

  function store(s) { try { s.setItem("__t", "1"); s.removeItem("__t"); return s; } catch (e) { return null; } }
  var LS = store(W.localStorage), SS = store(W.sessionStorage);
  function get(s, k) { try { return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function put(s, k, v) { try { if (s) s.setItem(k, v); } catch (e) {} }
  function getJSON(s, k) { try { return JSON.parse(get(s, k)); } catch (e) { return null; } }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  var loc = W.location;
  try { if (W.top !== W && W.top.location.href) loc = W.top.location; } catch (e) {}
  var q = new URLSearchParams(loc.search);
  var host = loc.hostname.replace(/^www\./, "");
  var isBot = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/i.test(nav.userAgent);
  var isLocal = /^(localhost|127\.0\.0\.1|)$/.test(loc.hostname) && q.get("track") !== "1";
  var enabled = !isBot && !isLocal;

  var vid = get(LS, "cddl_vid") || rid();
  put(LS, "cddl_vid", vid);
  var sid = get(SS, "cddl_sid"), isNewSession = !sid;
  if (!sid) { sid = rid(); put(SS, "cddl_sid", sid); }

  var src = null;
  if (q.get("utm_source")) {
    src = { us: q.get("utm_source"), um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "", ux: q.get("utm_content") || "", ut: q.get("utm_term") || "" };
  } else if (q.get("gclid")) src = { us: "google", um: "cpc" };
  else if (q.get("fbclid")) src = { us: "facebook", um: "social" };
  else if (q.get("zarsrc")) src = { us: "zalo", um: "social" };
  var ref = doc.referrer || "", refHost = "";
  try { refHost = ref ? new URL(ref).hostname.replace(/^www\./, "") : ""; } catch (e) {}
  if (refHost === host) { ref = ""; refHost = ""; }
  if (!src && isNewSession) {
    if (!refHost) src = { us: "(direct)", um: "(none)" };
    else if (/facebook|fb\.|messenger|instagram/.test(refHost)) src = { us: "facebook", um: "referral" };
    else if (/zalo/.test(refHost)) src = { us: "zalo", um: "referral" };
    else if (/google\./.test(refHost)) src = { us: "google", um: "organic" };
    else if (/coccoc|bing|yahoo|duckduckgo/.test(refHost)) src = { us: refHost.split(".")[0], um: "organic" };
    else if (/youtube|youtu\.be/.test(refHost)) src = { us: "youtube", um: "referral" };
    else if (/tiktok/.test(refHost)) src = { us: "tiktok", um: "referral" };
    else src = { us: refHost, um: "referral" };
  }
  if (src) {
    src.ref = ref.slice(0, 300);
    Object.keys(src).forEach(function (k) { src[k] = String(src[k] || "").slice(0, 150); });
    put(SS, "cddl_src", JSON.stringify(src));
  } else {
    src = getJSON(SS, "cddl_src") || { us: "(direct)", um: "(none)" };
  }
  var srcText = function (s) { return !s.us || s.us === "(direct)" ? "trực tiếp" : s.us + (s.um ? " / " + s.um : "") + (s.uc ? " · " + s.uc : ""); };
  if (!get(LS, "cddl_ft")) put(LS, "cddl_ft", srcText(src) + " (" + new Date().toLocaleDateString("vi-VN") + ")");
  var visits = Number(get(LS, "cddl_visits") || 0);
  if (isNewSession) { visits++; put(LS, "cddl_visits", String(visits)); }
  var ua = nav.userAgent;
  var dev = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  var page = host + loc.pathname;

  var LABEL = {
    pageview: "Truy cập trang đăng ký", scroll_50: "Cuộn 50% trang", scroll_90: "Cuộn gần hết trang", cta_click: "Bấm Đăng ký",
    form_start: "Điền form", lead: "Đăng ký thành công", thankyou_view: "Xem trang cảm ơn", zalo_click: "Bấm tham gia Zalo",
    fanpage_click: "Bấm theo dõi fanpage"
  };
  function pad(n) { return n < 10 ? "0" + n : n; }
  function remember(ev, detail) {
    var j = getJSON(LS, "cddl_j") || [];
    var d = new Date();
    var step = LABEL[ev] || ev;
    if (ev === "pageview" || ev === "thankyou_view") step = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + " " + step + (ev === "pageview" ? " (" + srcText(src) + ")" : "");
    else if (detail) step += " (" + detail + ")";
    j.push(step);
    put(LS, "cddl_j", JSON.stringify(j.slice(-30)));
  }

  var queue = [];
  function flush() {
    if (!enabled || !queue.length) return;
    var body = JSON.stringify({ type: "events", events: queue.splice(0, 40) });
    var sent = false;
    try { if (nav.sendBeacon) sent = nav.sendBeacon(API, new Blob([body], { type: "text/plain;charset=UTF-8" })); } catch (e) {}
    if (!sent) {
      try { fetch(API, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: body }); } catch (e) {}
    }
  }
  var once = {};
  function track(ev, detail, unique) {
    if (unique) { if (once[ev]) return; once[ev] = 1; }
    remember(ev, detail);
    queue.push({
      ts: Date.now(), vid: vid, sid: sid, ev: ev, detail: String(detail || "").slice(0, 150), page: page,
      us: src.us, um: src.um || "", uc: src.uc || "", ux: src.ux || "", ut: src.ut || "", ref: src.ref || "", dev: dev
    });
    if (ev === "pageview" || ev === "thankyou_view") flush();
  }

  W.CDDL_TRACK = {
    track: track,
    flush: flush,
    leadFields: function () {
      return {
        vid: vid, sess: sid, us: src.us || "", um: src.um || "", uc: src.uc || "", ux: src.ux || "", ut: src.ut || "",
        ref: src.ref || "", ft: get(LS, "cddl_ft") || "", dev: dev, visits: String(visits),
        journey: (getJSON(LS, "cddl_j") || []).join(" → ").slice(0, 1900)
      };
    },
    leadDone: function () { remember("lead"); flush(); }
  };

  var root = doc.getElementById("cddl-lp");
  var pageEv = (root && root.getAttribute("data-track-page")) || "pageview";
  track(pageEv, "", true);

  function scrolled() {
    var h = Math.max(doc.documentElement.scrollHeight, doc.body ? doc.body.scrollHeight : 0) - W.innerHeight;
    if (h <= 0) return;
    var r = (W.pageYOffset || doc.documentElement.scrollTop) / h;
    if (r >= 0.5) track("scroll_50", "", true);
    if (r >= 0.9) track("scroll_90", "", true);
  }
  if (pageEv === "pageview") W.addEventListener("scroll", scrolled, { passive: true });

  doc.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest("[data-zalo]")) { track("zalo_click", pageEv === "pageview" ? "Trang đăng ký" : "Trang cảm ơn"); flush(); return; }
    if (t.closest("[data-fanpage]")) { track("fanpage_click", pageEv === "pageview" ? "Trang đăng ký" : "Trang cảm ơn"); flush(); return; }
    var a = t.closest('.cddl-lp a[href="#dang-ky"]');
    if (!a) return;
    var place = "Khác";
    if (a.closest("#cddl-sticky")) place = "Nút nổi cuối màn hình";
    else if (a.closest("#top")) place = "Đầu trang (hero)";
    else if (a.closest(".final")) place = "Kêu gọi cuối trang";
    else {
      var sec = a.closest("section"), h = sec && sec.querySelector("h2");
      if (h) place = h.textContent.replace(/\s+/g, " ").trim().slice(0, 60);
    }
    track("cta_click", place);
  }, true);

  var form = doc.getElementById("cddl-fallback-form");
  if (form) form.addEventListener("focusin", function () { track("form_start", "", true); flush(); });

  setInterval(flush, 15000);
  doc.addEventListener("visibilitychange", function () { if (doc.visibilityState === "hidden") flush(); });
  W.addEventListener("pagehide", flush);
})();
