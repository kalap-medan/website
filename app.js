import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, deleteUser,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, onSnapshot, query, where,
  orderBy, limit, Timestamp, addDoc, setDoc, updateDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const IDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const DATE_LONG = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const DATE_SHORT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short" });
const TIME_SHORT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });
const ROLE_LABELS = { superadmin: "Superadmin", spv: "SPV", cashier: "Kasir", partner: "Mitra" };
const ICONS = { dashboard: "◫", transactions: "↗", pos: "▣", stock: "▤", partners: "♧", accounts: "♙", finance: "◉", partnerHome: "⌂", partnerMenu: "▦", partnerSales: "◷", requests: "＋" };

let app, auth, db;
let currentUser = null;
let profile = null;
let activePage = "dashboard";
let monthKey = jakartaMonthKey(new Date());
let historyDate = jakartaDateKey(new Date());
let chartDays = 31;
let cart = new Map();
let chartInstances = [];
let unsubscribers = [];
let monthUnsubscribers = [];
let store = { menus: [], partners: [], users: [], transactions: [], cashflows: [], movements: [], partnerSales: [], stockRequests: [] };
let busy = false;

function jakartaDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function jakartaMonthKey(date) { return jakartaDateKey(date).slice(0, 7); }
function dateFromKey(key, end = false) { return new Date(`${key}T${end ? "23:59:59.999" : "00:00:00.000"}+07:00`); }
function monthBounds(key) {
  const [year, month] = key.split("-").map(Number);
  return { start: new Date(`${key}-01T00:00:00+07:00`), end: new Date(`${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00+07:00`).setFullYear(month === 12 ? year + 1 : year) };
}
function monthRange(key) {
  const [year, month] = key.split("-").map(Number);
  const start = new Date(`${key}-01T00:00:00+07:00`);
  const end = new Date(`${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00+07:00`);
  return { start, end };
}
function asDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}
function dayKeyFromTimestamp(value) { const date = asDate(value); return date ? jakartaDateKey(date) : ""; }
function money(value) { return IDR.format(Number(value || 0)); }
function integer(value) { return new Intl.NumberFormat("id-ID").format(Number(value || 0)); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const date = asDate(value);
  return date ? new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "Asia/Jakarta" }).format(date) : "—";
}
function formatTime(value) { const date = asDate(value); return date ? TIME_SHORT.format(date) : "—"; }
function toast(message, type = "") {
  const region = $("#toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 4200);
}
function friendlyError(error) {
  const code = error?.code || "";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) return "Email atau kata sandi tidak sesuai.";
  if (code.includes("auth/email-already-in-use")) return "Email tersebut sudah terdaftar.";
  if (code.includes("auth/weak-password")) return "Kata sandi terlalu lemah. Gunakan minimal 8 karakter.";
  if (code.includes("auth/too-many-requests")) return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (code.includes("permission-denied")) return "Akses ditolak. Periksa role akun dan Firestore Rules.";
  if (code.includes("failed-precondition")) return error.message || "Tindakan tidak dapat diproses karena kondisi belum terpenuhi.";
  if (code.includes("already-exists")) return "Email akun tersebut sudah digunakan.";
  if (code.includes("unavailable")) return "Layanan Firebase sedang tidak tersedia. Periksa koneksi internet.";
  return error?.message || "Terjadi kesalahan. Silakan coba kembali.";
}
function setBusy(button, state, label = "Memproses...") {
  if (!button) return;
  if (state) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
  }
}
function requireRole(...roles) {
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Akun ini tidak memiliki izin untuk melakukan tindakan tersebut.");
  }
}
function transactionCode() {
  const date = jakartaDateKey(new Date()).replaceAll("-", "").slice(2);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KLP-${date}-${suffix}`;
}

// Semua operasi tulis dilakukan langsung ke Cloud Firestore.
// Firestore Security Rules tetap menjadi pemeriksaan akses utama di server.
async function callApi(name, payload = {}) {
  const actorUid = currentUser?.uid;
  const actorName = profile?.displayName || profile?.email || "Pengguna";

  if (name === "createManagedUser") {
    requireRole("superadmin");
    const displayName = String(payload.displayName || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const role = String(payload.role || "");
    if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Nama dan email harus diisi dengan benar.");
    if (password.length < 8) throw new Error("Kata sandi minimal 8 karakter.");
    if (!["spv", "cashier", "partner"].includes(role)) throw new Error("Role akun tidak valid.");
    let partnerId = null;
    let partnerName = null;
    if (role === "partner") {
      partnerId = String(payload.partnerId || "");
      if (!partnerId) throw new Error("Pilih data mitra untuk akun Mitra.");
      const partnerSnap = await getDoc(doc(db, "partners", partnerId));
      if (!partnerSnap.exists() || partnerSnap.data().active === false) throw new Error("Data mitra tidak ditemukan atau tidak aktif.");
      partnerName = partnerSnap.data().name;
    }
    const secondaryApp = initializeApp(firebaseConfig, `kalap-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const secondaryAuth = getAuth(secondaryApp);
    let createdUser = null;
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      createdUser = credential.user;
      await setDoc(doc(db, "users", createdUser.uid), {
        uid: createdUser.uid, displayName, email, role, partnerId, partnerName,
        active: true, createdAt: serverTimestamp(), createdBy: actorUid
      });
      return { uid: createdUser.uid, email, displayName, role, partnerName };
    } catch (error) {
      if (createdUser) {
        try { await deleteUser(createdUser); } catch (_) { /* akun dapat dibersihkan manual dari Authentication */ }
      }
      throw error;
    } finally {
      try { await signOut(secondaryAuth); } catch (_) {}
      try { await deleteApp(secondaryApp); } catch (_) {}
    }
  }

  if (name === "createPartner") {
    requireRole("superadmin");
    const data = {
      name: String(payload.name || "").trim(), phone: String(payload.phone || "").trim(),
      note: String(payload.note || "").trim(), active: true,
      createdAt: serverTimestamp(), createdBy: actorUid
    };
    if (!data.name) throw new Error("Nama mitra wajib diisi.");
    const ref = await addDoc(collection(db, "partners"), data);
    return { partnerId: ref.id, name: data.name };
  }

  if (name === "createMenu") {
    requireRole("superadmin");
    const partnerId = String(payload.partnerId || "");
    const partnerSnap = await getDoc(doc(db, "partners", partnerId));
    if (!partnerSnap.exists() || partnerSnap.data().active === false) throw new Error("Mitra tidak ditemukan atau tidak aktif.");
    const partner = partnerSnap.data();
    const data = {
      name: String(payload.name || "").trim(), partnerId, partnerName: partner.name,
      category: String(payload.category || "Lainnya").trim() || "Lainnya",
      price: Number(payload.price), stock: 0, active: true,
      createdAt: serverTimestamp(), createdBy: actorUid, updatedAt: serverTimestamp()
    };
    if (!data.name || !Number.isSafeInteger(data.price) || data.price < 1) throw new Error("Nama menu dan harga yang valid wajib diisi.");
    const ref = await addDoc(collection(db, "menus"), data);
    return { menuId: ref.id, name: data.name };
  }

  if (name === "updateMenu") {
    requireRole("superadmin");
    const menuId = String(payload.menuId || "");
    const data = {
      name: String(payload.name || "").trim(), category: String(payload.category || "Lainnya").trim() || "Lainnya",
      price: Number(payload.price), active: Boolean(payload.active), updatedAt: serverTimestamp(), updatedBy: actorUid
    };
    if (!menuId || !data.name || !Number.isSafeInteger(data.price) || data.price < 1) throw new Error("Data menu tidak valid.");
    await updateDoc(doc(db, "menus", menuId), data);
    return { menuId, name: data.name };
  }

  if (name === "createSale") {
    requireRole("superadmin", "spv", "cashier");
    const paymentMethod = String(payload.paymentMethod || "cash").toLowerCase();
    if (!["cash", "qris", "transfer"].includes(paymentMethod)) throw new Error("Metode pembayaran tidak valid.");
    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 50) throw new Error("Keranjang transaksi tidak valid.");
    const quantities = new Map();
    for (const item of payload.items) {
      const menuId = String(item.menuId || "");
      const qty = Number(item.qty);
      if (!menuId || !Number.isInteger(qty) || qty < 1 || qty > 1000) throw new Error("Jumlah menu tidak valid.");
      quantities.set(menuId, (quantities.get(menuId) || 0) + qty);
    }
    if (quantities.size > 10) throw new Error("Satu transaksi maksimal 10 jenis menu. Pisahkan menjadi beberapa transaksi.");
    const menuIds = [...quantities.keys()];
    const menuRefs = menuIds.map(id => doc(db, "menus", id));
    const saleRef = doc(collection(db, "transactions"));
    const cashflowRef = doc(collection(db, "cashflows"));
    const movementRefs = menuIds.map(() => doc(collection(db, "stockMovements")));
    const code = transactionCode();
    const result = await runTransaction(db, async tx => {
      const snaps = await Promise.all(menuRefs.map(ref => tx.get(ref)));
      const prepared = [];
      let total = 0;
      for (let i = 0; i < snaps.length; i += 1) {
        const snap = snaps[i];
        if (!snap.exists()) throw new Error("Salah satu menu tidak ditemukan.");
        const menuId = menuIds[i];
        const menu = snap.data();
        const qty = quantities.get(menuId);
        if (menu.active === false) throw new Error(`Menu ${menu.name} sedang nonaktif.`);
        const stockBefore = Number(menu.stock || 0);
        if (stockBefore < qty) throw new Error(`Stok ${menu.name} tidak cukup. Tersedia ${stockBefore}.`);
        const price = Number(menu.price || 0);
        const subtotal = price * qty;
        if (!Number.isSafeInteger(price) || price < 1 || !Number.isSafeInteger(subtotal)) throw new Error(`Harga menu ${menu.name} tidak valid.`);
        total += subtotal;
        prepared.push({ menuId, ref: menuRefs[i], movementRef: movementRefs[i], name: menu.name,
          partnerId: menu.partnerId || null, partnerName: menu.partnerName || "—", price, qty,
          subtotal, stockBefore, stockAfter: stockBefore - qty });
      }
      if (!Number.isSafeInteger(total) || total < 1) throw new Error("Total transaksi tidak valid.");
      const createdAt = serverTimestamp();
      const storedItems = prepared.map(item => ({
        menuId: item.menuId, name: item.name, partnerId: item.partnerId, partnerName: item.partnerName,
        price: item.price, qty: item.qty, subtotal: item.subtotal,
        stockBefore: item.stockBefore, stockAfter: item.stockAfter, movementId: item.movementRef.id
      }));
      tx.set(saleRef, { transactionCode: code, items: storedItems,
        movementIds: movementRefs.map(ref => ref.id), total, paymentMethod,
        cashierUid: actorUid, cashierName: actorName, createdAt, status: "completed" });
      for (const item of prepared) {
        tx.update(item.ref, { stock: item.stockAfter, updatedAt: createdAt, lastMovementId: item.movementRef.id });
        tx.set(item.movementRef, { type: "sale", qty: item.qty, menuId: item.menuId, menuName: item.name,
          partnerId: item.partnerId, partnerName: item.partnerName, stockBefore: item.stockBefore,
          stockAfter: item.stockAfter, transactionId: saleRef.id, transactionCode: code,
          actorUid, actorName, createdAt });
      }
      const groups = new Map();
      for (const item of prepared) {
        if (!item.partnerId) continue;
        if (!groups.has(item.partnerId)) groups.set(item.partnerId, { total: 0, qty: 0, items: [], partnerName: item.partnerName });
        const group = groups.get(item.partnerId);
        group.total += item.subtotal; group.qty += item.qty;
        group.items.push({ menuId: item.menuId, name: item.name, price: item.price, qty: item.qty, subtotal: item.subtotal });
      }
      for (const [partnerId, group] of groups.entries()) {
        const partnerSaleRef = doc(collection(db, "partnerSales"));
        tx.set(partnerSaleRef, { partnerId, partnerName: group.partnerName, transactionId: saleRef.id,
          transactionCode: code, total: group.total, qty: group.qty, items: group.items,
          paymentMethod, createdAt, status: "recorded" });
      }
      tx.set(cashflowRef, { type: "income", amount: total, category: "Penjualan",
        note: `Penjualan ${code}`, source: "sale", transactionId: saleRef.id,
        transactionCode: code, createdAt, createdBy: actorUid });
      return { transactionId: saleRef.id, transactionCode: code, total, paymentMethod,
        items: prepared.map(item => ({ name: item.name, qty: item.qty, subtotal: item.subtotal })) };
    });
    return result;
  }

  if (name === "receiveStock") {
    requireRole("superadmin", "spv");
    const menuId = String(payload.menuId || "");
    const qty = Number(payload.qty);
    if (!menuId || !Number.isInteger(qty) || qty < 1 || qty > 100000) throw new Error("Jumlah stok tidak valid.");
    const requestId = payload.requestId ? String(payload.requestId) : null;
    const menuRef = doc(db, "menus", menuId);
    const movementRef = doc(collection(db, "stockMovements"));
    return await runTransaction(db, async tx => {
      const menuSnap = await tx.get(menuRef);
      if (!menuSnap.exists()) throw new Error("Menu tidak ditemukan.");
      const menu = menuSnap.data();
      let requestSnap = null;
      if (requestId) {
        requestSnap = await tx.get(doc(db, "stockRequests", requestId));
        if (!requestSnap.exists()) throw new Error("Permintaan stok tidak ditemukan.");
        const requestData = requestSnap.data();
        if (requestData.status !== "pending" || requestData.menuId !== menuId || Number(requestData.qty) !== qty || requestData.partnerId !== menu.partnerId) {
          throw new Error("Permintaan stok sudah diproses atau datanya tidak cocok.");
        }
      }
      const stockBefore = Number(menu.stock || 0);
      const stockAfter = stockBefore + qty;
      const createdAt = serverTimestamp();
      tx.update(menuRef, { stock: stockAfter, updatedAt: createdAt, lastMovementId: movementRef.id });
      tx.set(movementRef, { type: "in", qty, menuId, menuName: menu.name,
        partnerId: menu.partnerId || null, partnerName: menu.partnerName || "—",
        stockBefore, stockAfter, note: String(payload.note || ""),
        source: requestId ? "partner_request" : "manual", requestId,
        actorUid, actorName, createdAt });
      if (requestId) tx.update(doc(db, "stockRequests", requestId), {
        status: "received", receivedAt: createdAt, receivedBy: actorUid, receivedQty: qty, movementId: movementRef.id
      });
      return { menuName: menu.name, stockBefore, stockAfter, qty };
    });
  }

  if (name === "createFinanceEntry") {
    requireRole("superadmin");
    const type = String(payload.type || "");
    const amount = Number(payload.amount);
    const category = String(payload.category || "").trim();
    if (!["income", "expense"].includes(type) || !Number.isSafeInteger(amount) || amount < 1 || !category) throw new Error("Data pemasukan/pengeluaran tidak valid.");
    const ref = await addDoc(collection(db, "cashflows"), { type, amount, category,
      note: String(payload.note || ""), source: "manual", createdAt: serverTimestamp(), createdBy: actorUid });
    return { entryId: ref.id };
  }

  if (name === "createStockRequest") {
    requireRole("partner");
    const partnerId = profile.partnerId;
    const menuId = String(payload.menuId || "");
    const qty = Number(payload.qty);
    if (!partnerId || !menuId || !Number.isInteger(qty) || qty < 1 || qty > 100000) throw new Error("Data permintaan stok tidak valid.");
    const menuSnap = await getDoc(doc(db, "menus", menuId));
    if (!menuSnap.exists()) throw new Error("Menu tidak ditemukan.");
    const menu = menuSnap.data();
    if (menu.partnerId !== partnerId || menu.active === false) throw new Error("Anda hanya dapat meminta stok untuk menu aktif milik sendiri.");
    const ref = await addDoc(collection(db, "stockRequests"), { partnerId,
      partnerName: profile.partnerName || menu.partnerName || "Mitra", menuId, menuName: menu.name,
      qty, note: String(payload.note || ""), status: "pending", createdAt: serverTimestamp(), createdBy: actorUid });
    return { requestId: ref.id };
  }

  throw new Error(`Aksi ${name} tidak dikenali.`);
}
function safeUnsubscribe(list) { list.forEach(unsub => { try { unsub(); } catch (_) {} }); list.length = 0; }
function resetStore() {
  store = { menus: [], partners: [], users: [], transactions: [], cashflows: [], movements: [], partnerSales: [], stockRequests: [] };
}

function startApp() {
  if (!isFirebaseConfigured) {
    $("#firebase-setup-note")?.classList.remove("hidden");
    $("#login-submit").disabled = true;
    return;
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  onAuthStateChanged(auth, async user => {
    if (!user) {
      currentUser = null;
      profile = null;
      safeUnsubscribe(unsubscribers);
      safeUnsubscribe(monthUnsubscribers);
      resetStore();
      cart.clear();
      showLogin();
      return;
    }
    currentUser = user;
    resetStore();
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) throw new Error("Profil akun belum dibuat oleh superadmin.");
      const data = snap.data();
      if (!data.active) throw new Error("Akun ini dinonaktifkan. Hubungi superadmin.");
      if (!ROLE_LABELS[data.role]) throw new Error("Role akun tidak dikenali. Hubungi superadmin.");
      profile = { uid: user.uid, ...data };
      monthKey = jakartaMonthKey(new Date());
      historyDate = jakartaDateKey(new Date());
      chartDays = 31;
      activePage = data.role === "cashier" ? "pos" : data.role === "partner" ? "partnerHome" : "dashboard";
      showShell();
      startSubscriptions();
      renderPage();
    } catch (error) {
      toast(friendlyError(error), "error");
      await signOut(auth);
    }
  });
}

function showLogin() {
  $("#login-screen").classList.remove("hidden");
  $("#app-shell").classList.add("hidden");
}
function showShell() {
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  const name = profile.displayName || profile.name || currentUser.email || "Pengguna";
  $("#user-name").textContent = name;
  $("#user-role").textContent = ROLE_LABELS[profile.role];
  $("#user-avatar").textContent = name.trim().charAt(0).toUpperCase();
  $("#footer-year").textContent = new Date().getFullYear();
  updateClockLabels();
}
function updateClockLabels() {
  $("#topbar-date").textContent = DATE_LONG.format(new Date());
  $("#footer-year").textContent = new Date().getFullYear();
}

function startSubscriptions() {
  safeUnsubscribe(unsubscribers);
  const role = profile.role;
  const menuQuery = role === "partner"
    ? query(collection(db, "menus"), where("partnerId", "==", profile.partnerId), where("active", "==", true))
    : query(collection(db, "menus"), orderBy("name", "asc"));
  unsubscribers.push(onSnapshot(menuQuery, snap => {
    store.menus = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    if (cart.size) reconcileCart();
    if (activePage === "dashboard" || activePage === "pos" || activePage === "stock" || activePage === "partnerMenu" || activePage === "partnerHome") renderPage();
  }, onDataError));

  if (role === "superadmin") {
    unsubscribers.push(onSnapshot(query(collection(db, "partners"), orderBy("name", "asc")), snap => {
      store.partners = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderIfPage("partners", "accounts", "stock");
    }, onDataError));
    unsubscribers.push(onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), snap => {
      store.users = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderIfPage("accounts");
    }, onDataError));
  }
  if (role === "superadmin" || role === "spv") {
    const requestQuery = query(collection(db, "stockRequests"), orderBy("createdAt", "desc"), limit(100));
    unsubscribers.push(onSnapshot(requestQuery, snap => {
      store.stockRequests = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderIfPage("requests", "dashboard");
    }, onDataError));
  }
  if (role === "partner") {
    const requestQuery = query(collection(db, "stockRequests"), where("partnerId", "==", profile.partnerId), orderBy("createdAt", "desc"), limit(100));
    unsubscribers.push(onSnapshot(requestQuery, snap => {
      store.stockRequests = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderIfPage("requests", "partnerHome");
    }, onDataError));
  }
  subscribeMonthData(monthKey);
}

function subscribeMonthData(key) {
  safeUnsubscribe(monthUnsubscribers);
  monthKey = key;
  const { start, end } = monthRange(key);
  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);
  if (profile.role === "partner") {
    const q = query(collection(db, "partnerSales"), where("partnerId", "==", profile.partnerId), where("createdAt", ">=", startTs), where("createdAt", "<", endTs), orderBy("createdAt", "desc"), limit(1500));
    monthUnsubscribers.push(onSnapshot(q, snap => {
      store.partnerSales = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderPage();
    }, onDataError));
    return;
  }
  const transactionConstraints = [where("createdAt", ">=", startTs), where("createdAt", "<", endTs)];
  if (profile.role === "cashier") transactionConstraints.push(where("cashierUid", "==", profile.uid));
  transactionConstraints.push(orderBy("createdAt", "desc"), limit(1500));
  const transactionQuery = query(collection(db, "transactions"), ...transactionConstraints);
  const movementQuery = query(collection(db, "stockMovements"), where("createdAt", ">=", startTs), where("createdAt", "<", endTs), orderBy("createdAt", "desc"), limit(3000));
  monthUnsubscribers.push(onSnapshot(transactionQuery, snap => {
    store.transactions = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    renderPage();
  }, onDataError));
  monthUnsubscribers.push(onSnapshot(movementQuery, snap => {
    store.movements = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    renderPage();
  }, onDataError));
  if (profile.role === "superadmin") {
    const cashQuery = query(collection(db, "cashflows"), where("createdAt", ">=", startTs), where("createdAt", "<", endTs), orderBy("createdAt", "desc"), limit(1500));
    monthUnsubscribers.push(onSnapshot(cashQuery, snap => {
      store.cashflows = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      renderPage();
    }, onDataError));
  }
}
function onDataError(error) {
  console.error(error);
  if (error?.code === "permission-denied") toast("Firebase menolak akses data ini. Periksa role akun dan Firestore Rules.", "error");
  else if (error?.code === "failed-precondition") toast("Query memerlukan indeks Firestore. Buka link indeks pada Console Firebase.", "error");
  else toast(friendlyError(error), "error");
}
function renderIfPage(...pages) { if (pages.includes(activePage)) renderPage(); }

function navItems() {
  switch (profile.role) {
    case "superadmin": return [
      { section: "OVERVIEW" }, { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
      { section: "OPERASIONAL" }, { id: "pos", label: "Kasir / POS", icon: ICONS.pos }, { id: "transactions", label: "Riwayat & stok harian", icon: ICONS.transactions }, { id: "stock", label: "Menu & persediaan", icon: ICONS.stock }, { id: "requests", label: "Permintaan stok", icon: ICONS.requests },
      { section: "MANAJEMEN" }, { id: "partners", label: "Mitra", icon: ICONS.partners }, { id: "accounts", label: "Akun pengguna", icon: ICONS.accounts }, { id: "finance", label: "Keuangan", icon: ICONS.finance }
    ];
    case "spv": return [
      { section: "OVERVIEW" }, { id: "dashboard", label: "Dashboard SPV", icon: ICONS.dashboard },
      { section: "OPERASIONAL" }, { id: "pos", label: "Kasir / POS", icon: ICONS.pos }, { id: "transactions", label: "Riwayat transaksi", icon: ICONS.transactions }, { id: "stock", label: "Pemantauan stok", icon: ICONS.stock }, { id: "requests", label: "Permintaan stok", icon: ICONS.requests }
    ];
    case "cashier": return [
      { section: "KASIR" }, { id: "pos", label: "Transaksi baru", icon: ICONS.pos }, { id: "transactions", label: "Riwayat transaksi", icon: ICONS.transactions }
    ];
    default: return [
      { section: "PORTAL MITRA" }, { id: "partnerHome", label: "Dashboard mitra", icon: ICONS.partnerHome }, { id: "partnerMenu", label: "Menu saya", icon: ICONS.partnerMenu }, { id: "partnerSales", label: "Penjualan saya", icon: ICONS.partnerSales }, { id: "requests", label: "Permintaan stok", icon: ICONS.requests }
    ];
  }
}
function renderNav() {
  $("#side-nav").innerHTML = navItems().map(item => item.section
    ? `<div class="nav-section-label">${item.section}</div>`
    : `<button class="nav-link ${activePage === item.id ? "active" : ""}" data-nav="${item.id}"><span class="nav-icon">${item.icon}</span>${item.label}</button>`).join("");
}
function renderPage() {
  if (!profile) return;
  renderNav();
  const titles = {
    dashboard: profile.role === "spv" ? "Dashboard SPV" : "Dashboard",
    pos: "Kasir / POS", transactions: profile.role === "superadmin" ? "Riwayat & stok harian" : "Riwayat transaksi",
    stock: profile.role === "spv" ? "Pemantauan stok" : "Menu & persediaan", partners: "Manajemen mitra", accounts: "Akun pengguna",
    finance: "Keuangan", requests: "Permintaan stok", partnerHome: "Dashboard mitra", partnerMenu: "Menu saya", partnerSales: "Penjualan saya"
  };
  $("#breadcrumb-current").textContent = titles[activePage] || "Dashboard";
  destroyCharts();
  const page = $("#page-content");
  switch (activePage) {
    case "dashboard": page.innerHTML = profile.role === "spv" ? renderSpvDashboard() : renderSuperadminDashboard(); break;
    case "pos": page.innerHTML = renderPosPage(); break;
    case "transactions": page.innerHTML = ["superadmin", "spv"].includes(profile.role) ? renderHistoryPage() : renderCashierHistoryPage(); break;
    case "stock": page.innerHTML = renderStockPage(); break;
    case "partners": page.innerHTML = renderPartnersPage(); break;
    case "accounts": page.innerHTML = renderAccountsPage(); break;
    case "finance": page.innerHTML = renderFinancePage(); break;
    case "requests": page.innerHTML = renderRequestsPage(); break;
    case "partnerHome": page.innerHTML = renderPartnerHome(); break;
    case "partnerMenu": page.innerHTML = renderPartnerMenu(); break;
    case "partnerSales": page.innerHTML = renderPartnerSales(); break;
    default: page.innerHTML = `<div class="panel">Halaman tidak ditemukan.</div>`;
  }
  attachPageEvents();
  if (activePage === "dashboard") profile.role === "spv" ? mountSpvChart() : mountSuperadminCharts();
}
function showPage(page) {
  activePage = page;
  $("#sidebar").classList.remove("open");
  if (["spv", "cashier", "partner"].includes(profile?.role) && ["dashboard", "pos", "partnerHome"].includes(page)) {
    const currentMonth = jakartaMonthKey(new Date());
    if (currentMonth !== monthKey) subscribeMonthData(currentMonth);
  }
  renderPage();
}
function pageHeading(title, subtitle, actions = "") {
  return `<div class="page-heading"><div><span class="eyebrow">KALAP WORKSPACE</span><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function statCard(label, value, icon, foot = "Data tersinkron realtime") {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
}
function panelHeader(title, subtitle, action = "") {
  return `<div class="panel-header"><div><h3 class="panel-title">${title}</h3><div class="panel-subtitle">${subtitle}</div></div>${action}</div>`;
}
function selectedMonthControl() { return `<input type="month" id="month-select" value="${monthKey}" aria-label="Pilih bulan">`; }
function getMonthTransactions() { return store.transactions.filter(item => dayKeyFromTimestamp(item.createdAt).startsWith(monthKey)); }
function sumBy(list, key) { return list.reduce((sum, item) => sum + Number(item[key] || 0), 0); }
function sumTransactionItems(transactions, key) { return transactions.reduce((sum, sale) => sum + (sale.items || []).reduce((inner, item) => inner + Number(item[key] || 0), 0), 0); }

function renderSuperadminDashboard() {
  const txs = getMonthTransactions();
  const revenue = sumBy(txs, "total");
  const cashIn = store.cashflows.filter(row => row.type === "income").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const cashOut = store.cashflows.filter(row => row.type === "expense").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const historySales = txs.slice(0, 5);
  return `${pageHeading("Dashboard", "Ringkasan bisnis KALAP dan aktivitas operasional.", `${selectedMonthControl()}<div class="range-control"><span>Rentang grafik</span><input id="chart-days" type="range" min="1" max="31" value="${chartDays}"><strong id="chart-days-label">${chartDays} hari</strong></div>`)}
    <section class="stats-grid">
      ${statCard("Total pendapatan bulan ini", money(revenue), "↗", `${integer(txs.length)} transaksi tercatat`)}
      ${statCard("Total penjualan", integer(txs.length), "▣", "Jumlah transaksi bulan terpilih")}
      ${statCard("Total mitra", integer(store.partners.length), "♧", "Mitra terdaftar")}
      ${statCard("Total menu", integer(store.menus.length), "▤", "Menu terdaftar di sistem")}
    </section>
    <section class="content-grid">
      <article class="panel">${panelHeader("Grafik penjualan", `Omzet harian · ${monthKey}`, `<span class="status neutral">LIVE DATA</span>`)}<div class="chart-wrap"><canvas id="sales-chart"></canvas></div></article>
      <article class="panel">${panelHeader("Arus kas", `Pemasukan dan pengeluaran · ${monthKey}`)}<div class="chart-wrap"><canvas id="cashflow-chart"></canvas></div><div class="summary-list" style="margin-top:8px"><div class="summary-row"><span>Total pemasukan</span><strong>${money(cashIn)}</strong></div><div class="summary-row"><span>Total pengeluaran</span><strong>${money(cashOut)}</strong></div><div class="summary-divider"></div><div class="summary-row"><span>Selisih arus kas</span><strong>${money(cashIn - cashOut)}</strong></div></div></article>
    </section>
    <section class="panel">${panelHeader("Transaksi terbaru", "Lima transaksi terbaru pada bulan terpilih", `<button class="panel-action" data-nav="transactions">Lihat riwayat →</button>`)}${renderTransactionTable(historySales, true)}</section>`;
}

function renderSpvDashboard() {
  const today = jakartaDateKey(new Date());
  const todaysSales = store.transactions.filter(item => dayKeyFromTimestamp(item.createdAt) === today);
  const todaysMovements = store.movements.filter(item => dayKeyFromTimestamp(item.createdAt) === today);
  const sold = todaysMovements.filter(item => item.type === "sale").reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const received = todaysMovements.filter(item => item.type === "in").reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const total = sumBy(todaysSales, "total");
  const recent = todaysSales.slice(0, 6);
  return `${pageHeading("Dashboard SPV", "Pantau aktivitas harian dan akses seluruh operasional kasir.", `<span class="status success"><span class="live-dot"></span>&nbsp; Hari ini</span>`)}
    <section class="stats-grid">
      ${statCard("Penjualan hari ini", money(total), "↗", `${integer(todaysSales.length)} transaksi`)}
      ${statCard("Barang masuk hari ini", integer(received), "＋", "Total unit stok diterima")}
      ${statCard("Barang terjual", integer(sold), "▣", "Total unit dari transaksi hari ini")}
      ${statCard("Sisa stok tersedia", integer(store.menus.filter(menu => menu.active !== false).reduce((sum, menu) => sum + Number(menu.stock || 0), 0)), "▤", "Stok aktual seluruh menu aktif")}
    </section>
    <section class="content-grid">
      <article class="panel">${panelHeader("Grafik penjualan hari ini", "Pergerakan omzet per jam", `<span class="status neutral">REALTIME</span>`)}<div class="chart-wrap"><canvas id="spv-hour-chart"></canvas></div></article>
      <article class="panel">${panelHeader("Ringkasan operasional", "Pergerakan stok hari ini")}<div class="summary-list"><div class="summary-row"><span>Total omzet</span><strong>${money(total)}</strong></div><div class="summary-row"><span>Transaksi selesai</span><strong>${integer(todaysSales.length)}</strong></div><div class="summary-row"><span>Unit barang masuk</span><strong>${integer(received)} unit</strong></div><div class="summary-row"><span>Unit barang terjual</span><strong>${integer(sold)} unit</strong></div><div class="summary-divider"></div><div class="summary-row"><span>Permintaan stok menunggu</span><strong>${integer(store.stockRequests.length)}</strong></div><button class="btn btn-light btn-wide" data-nav="pos">Buka kasir / POS →</button></div></article>
    </section>
    <section class="panel" style="margin-bottom:15px">${panelHeader("Detail stok hari ini", "Barang masuk, unit terjual, dan sisa setelah pergerakan terakhir")}${renderDailyMovementTable(todaysMovements)}</section>
    <section class="panel">${panelHeader("Penjualan hari ini", "Transaksi terbaru yang dilakukan kasir", `<button class="panel-action" data-nav="transactions">Lihat semua →</button>`)}${renderTransactionTable(recent, true)}</section>`;
}

function mountSuperadminCharts() {
  const salesCanvas = $("#sales-chart");
  const cashCanvas = $("#cashflow-chart");
  if (!salesCanvas || typeof Chart === "undefined") return;
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const displayDays = Math.min(chartDays, daysInMonth);
  const txMap = new Map();
  const inMap = new Map();
  const outMap = new Map();
  for (const tx of store.transactions) { const key = dayKeyFromTimestamp(tx.createdAt); txMap.set(key, (txMap.get(key) || 0) + Number(tx.total || 0)); }
  for (const row of store.cashflows) {
    const key = dayKeyFromTimestamp(row.createdAt);
    const map = row.type === "expense" ? outMap : inMap;
    map.set(key, (map.get(key) || 0) + Number(row.amount || 0));
  }
  const keys = Array.from({ length: displayDays }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`);
  const labels = keys.map(key => Number(key.slice(-2)));
  const fullLabels = keys.map(key => formatDate(dateFromKey(key), { day: "numeric", month: "long", year: "numeric" }));
  const commonOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#202821", padding: 11, titleFont: { family: "DM Sans", size: 10 }, bodyFont: { family: "DM Sans", size: 10 }, callbacks: { title: items => fullLabels[items[0]?.dataIndex] || "" } } },
    scales: { x: { grid: { display: false }, ticks: { color: "#9ba69c", font: { size: 9 } } }, y: { beginAtZero: true, grid: { color: "#f0f2ee" }, ticks: { color: "#a2aba3", font: { size: 9 }, callback: value => value >= 1000000 ? `${(value / 1000000).toFixed(1)}jt` : value >= 1000 ? `${Math.round(value / 1000)}rb` : value } } }
  };
  const salesChart = new Chart(salesCanvas, { type: "line", data: { labels, datasets: [{ label: "Penjualan", data: keys.map(key => txMap.get(key) || 0), borderColor: "#91b94a", backgroundColor: "rgba(199,236,105,.19)", fill: true, tension: .35, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: "#91b94a" }] }, options: commonOptions });
  chartInstances.push(salesChart);
  if (cashCanvas) {
    const cashChart = new Chart(cashCanvas, { type: "bar", data: { labels, datasets: [
      { label: "Pemasukan", data: keys.map(key => inMap.get(key) || 0), backgroundColor: "#9bc45b", borderRadius: 4, maxBarThickness: 13 },
      { label: "Pengeluaran", data: keys.map(key => outMap.get(key) || 0), backgroundColor: "#e3a19a", borderRadius: 4, maxBarThickness: 13 }
    ] }, options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: true, position: "bottom", labels: { boxWidth: 7, boxHeight: 7, usePointStyle: true, color: "#89958b", font: { size: 9 }, padding: 13 } } } } });
    chartInstances.push(cashChart);
  }
}
function mountSpvChart() {
  const canvas = $("#spv-hour-chart");
  if (!canvas || typeof Chart === "undefined") return;
  const today = jakartaDateKey(new Date());
  const hourly = Array(24).fill(0);
  for (const tx of store.transactions.filter(item => dayKeyFromTimestamp(item.createdAt) === today)) {
    const date = asDate(tx.createdAt);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(date));
    hourly[hour] += Number(tx.total || 0);
  }
  const labels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
  chartInstances.push(new Chart(canvas, { type: "line", data: { labels, datasets: [{ data: hourly, borderColor: "#91b94a", backgroundColor: "rgba(199,236,105,.18)", fill: true, tension: .35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5 }] }, options: {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#202821", callbacks: { label: item => money(item.raw) } } },
    scales: { x: { grid: { display: false }, ticks: { color: "#9ba69c", font: { size: 8 }, maxTicksLimit: 8 } }, y: { beginAtZero: true, grid: { color: "#f0f2ee" }, ticks: { color: "#a2aba3", font: { size: 9 }, callback: value => value >= 1000 ? `${Math.round(value / 1000)}rb` : value } } }
  } }));
}
function destroyCharts() { chartInstances.forEach(chart => { try { chart.destroy(); } catch (_) {} }); chartInstances = []; }

function renderTransactionTable(items, showAction = true) {
  if (!items.length) return `<div class="table-wrap"><table><tbody><tr><td class="table-empty">Belum ada transaksi pada periode ini.</td></tr></tbody></table></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Kode transaksi</th><th>Waktu</th><th>Kasir</th><th>Item</th><th>Total</th><th>Detail</th></tr></thead><tbody>${items.map(tx => `<tr><td><strong>${escapeHtml(tx.transactionCode || tx.id.slice(0, 8).toUpperCase())}</strong></td><td>${formatDate(tx.createdAt)} · ${formatTime(tx.createdAt)}</td><td>${escapeHtml(tx.cashierName || "Kasir")}</td><td>${integer((tx.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0))} unit</td><td><strong>${money(tx.total)}</strong></td><td><button class="action-link" data-detail-tx="${tx.id}">Lihat detail</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderDailyMovementTable(movements) {
  const grouped = new Map();
  for (const movement of movements) {
    const key = movement.menuId;
    if (!grouped.has(key)) grouped.set(key, { name: movement.menuName, partner: movement.partnerName || "—", incoming: 0, sold: 0, last: movement });
    const row = grouped.get(key);
    if (movement.type === "in") row.incoming += Number(movement.qty || 0);
    if (movement.type === "sale") row.sold += Number(movement.qty || 0);
    if (asDate(movement.createdAt) > asDate(row.last.createdAt)) row.last = movement;
  }
  const rows = [...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name));
  return `<div class="table-wrap"><table><thead><tr><th>Menu</th><th>Mitra</th><th>Barang masuk</th><th>Terjual</th><th>Sisa setelah catatan terakhir</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${escapeHtml(row.partner)}</td><td>${integer(row.incoming)}</td><td>${integer(row.sold)}</td><td><strong>${integer(row.last.stockAfter)}</strong></td></tr>`).join("")||`<tr><td colspan="5" class="table-empty">Belum ada pergerakan stok hari ini.</td></tr>`}</tbody></table></div>`;
}
function renderHistoryPage() {
  const selectedTx = store.transactions.filter(tx => dayKeyFromTimestamp(tx.createdAt) === historyDate);
  const movements = store.movements.filter(item => dayKeyFromTimestamp(item.createdAt) === historyDate);
  const grouped = new Map();
  for (const movement of movements) {
    const key = movement.menuId;
    if (!grouped.has(key)) grouped.set(key, { menuName: movement.menuName, partnerName: movement.partnerName || "—", incoming: 0, sold: 0, last: movement });
    const group = grouped.get(key);
    if (movement.type === "in") group.incoming += Number(movement.qty || 0);
    if (movement.type === "sale") group.sold += Number(movement.qty || 0);
    if (asDate(movement.createdAt) > asDate(group.last.createdAt)) group.last = movement;
  }
  const stockRows = [...grouped.values()].sort((a, b) => a.menuName.localeCompare(b.menuName)).map(row => `<tr><td><strong>${escapeHtml(row.menuName)}</strong><div class="muted">${escapeHtml(row.partnerName)}</div></td><td>${integer(row.incoming)}</td><td>${integer(row.sold)}</td><td><strong>${integer(row.last.stockAfter)}</strong></td><td>${formatTime(row.last.createdAt)}</td></tr>`).join("");
  const revenue = sumBy(selectedTx, "total");
  return `${pageHeading("Riwayat & stok harian", "Telusuri transaksi, barang masuk, barang terjual, dan catatan stok per tanggal.", `<input type="date" id="history-date" value="${historyDate}" aria-label="Pilih tanggal">`)}
    <section class="stats-grid">${statCard("Penjualan tanggal ini", money(revenue), "↗", `${integer(selectedTx.length)} transaksi`)}${statCard("Unit barang masuk", integer(movements.filter(m => m.type === "in").reduce((s,m)=>s+Number(m.qty||0),0)), "＋", "Berdasarkan catatan stok")}${statCard("Unit terjual", integer(movements.filter(m => m.type === "sale").reduce((s,m)=>s+Number(m.qty||0),0)), "▣", "Berdasarkan transaksi kasir")}${statCard("Menu dengan aktivitas", integer(grouped.size), "▤", "Menu yang bergerak pada tanggal ini")}</section>
    <section class="panel" style="margin-bottom:15px">${panelHeader("Detail pergerakan stok", `Pergerakan yang tercatat pada ${formatDate(dateFromKey(historyDate), { day: "numeric", month: "long", year: "numeric" })}`, `<span class="status neutral">STOCK LOG</span>`)}<div class="table-wrap"><table><thead><tr><th>Menu / mitra</th><th>Barang masuk</th><th>Terjual</th><th>Sisa setelah pergerakan terakhir</th><th>Waktu catat</th></tr></thead><tbody>${stockRows || `<tr><td colspan="5" class="table-empty">Belum ada pergerakan stok pada tanggal ini.</td></tr>`}</tbody></table></div><div class="helper-text">Kolom sisa menunjukkan stok sesaat setelah pergerakan terakhir yang tercatat pada tanggal tersebut, bukan stok aktual saat ini.</div></section>
    <section class="panel">${panelHeader("Transaksi pada tanggal ini", `${integer(selectedTx.length)} transaksi tersimpan`)}${renderTransactionTable(selectedTx, true)}${selectedTx.length ? `<div style="margin-top:13px;display:flex;justify-content:flex-end"><strong>Total penjualan: ${money(revenue)}</strong></div>` : ""}</section>`;
}
function renderCashierHistoryPage() {
  const filtered = store.transactions.filter(tx => dayKeyFromTimestamp(tx.createdAt) === historyDate);
  return `${pageHeading("Riwayat transaksi", "Cari transaksi kasir berdasarkan tanggal.", `<input type="date" id="history-date" value="${historyDate}">`)}<section class="stats-grid">${statCard("Total transaksi", integer(filtered.length), "▣", formatDate(dateFromKey(historyDate)))}${statCard("Total penjualan", money(sumBy(filtered,"total")), "↗", "Nilai transaksi pada tanggal terpilih")}</section><section class="panel">${panelHeader("Daftar transaksi", `Transaksi tanggal ${formatDate(dateFromKey(historyDate))}`)}${renderTransactionTable(filtered, true)}<div class="helper-text">Untuk koreksi transaksi yang sudah selesai, hubungi superadmin. Riwayat transaksi tidak bisa dihapus melalui akun kasir.</div></section>`;
}

function renderPosPage() {
  const availableMenus = store.menus.filter(menu => menu.active !== false);
  const categories = [...new Set(availableMenus.map(menu => menu.category || "Lainnya"))];
  const cartItems = [...cart.values()];
  const total = cartItems.reduce((sum, row) => sum + row.price * row.qty, 0);
  return `${pageHeading("Kasir / POS", "Pilih menu, atur jumlah, lalu selesaikan pembayaran.", `<span class="status success">● Sistem siap</span>`)}
    <div class="pos-layout"><section class="panel">${panelHeader("Daftar menu", `${integer(availableMenus.length)} menu aktif`, `<span class="muted" style="font-size:10px">Klik menu untuk menambahkan</span>`)}
      ${availableMenus.length ? `<div class="menu-grid">${availableMenus.map(menu => `<button class="menu-tile" data-add-menu="${menu.id}" ${Number(menu.stock || 0) < 1 ? "disabled" : ""}><div class="menu-tile-top"><span>${escapeHtml(menu.category || "Menu")}</span><span>${Number(menu.stock || 0) < 1 ? "Habis" : `Stok ${integer(menu.stock)}`}</span></div><h3>${escapeHtml(menu.name)}</h3><div class="price">${money(menu.price)}</div><div class="stock-mini">${escapeHtml(menu.partnerName || "KALAP")}</div></button>`).join("")}</div>` : `<div class="cart-empty">Belum ada menu aktif.<br>Hubungi superadmin untuk menambahkan menu.</div>`}
    </section><aside class="panel cart-panel">${panelHeader("Pesanan", `${cartItems.length} jenis menu dalam keranjang`)}<div class="cart-items">${cartItems.length ? cartItems.map(item => `<div class="cart-item"><div><div class="cart-item-name">${escapeHtml(item.name)}</div><div class="cart-item-price">${money(item.price)} / item</div></div><div class="qty-control"><button data-cart-dec="${item.menuId}" aria-label="Kurangi">−</button><strong>${item.qty}</strong><button data-cart-inc="${item.menuId}" aria-label="Tambah">＋</button></div></div>`).join("") : `<div class="cart-empty">Keranjang masih kosong.<br>Pilih menu di sebelah kiri.</div>`}</div><div class="cart-total"><span>Total pembayaran</span><strong>${money(total)}</strong></div><label class="field-label" for="payment-method">Metode pembayaran</label><select id="payment-method"><option value="cash">Tunai</option><option value="qris">QRIS</option><option value="transfer">Transfer</option></select><button class="btn btn-primary" id="checkout-btn" ${cartItems.length ? "" : "disabled"}>Selesaikan transaksi <span>→</span></button><button class="btn btn-light" id="clear-cart-btn" ${cartItems.length ? "" : "disabled"}>Kosongkan keranjang</button></aside></div>
    <section class="panel" style="margin-top:15px">${panelHeader("Transaksi terbaru", "Aktivitas penjualan pada bulan yang dipilih", `<button class="panel-action" data-nav="transactions">Lihat riwayat →</button>`)}${renderTransactionTable(store.transactions.slice(0, 5), true)}</section>`;
}
function reconcileCart() {
  for (const [id, row] of cart.entries()) {
    const menu = store.menus.find(item => item.id === id);
    if (!menu || menu.active === false) cart.delete(id);
    else if (row.qty > Number(menu.stock || 0)) row.qty = Number(menu.stock || 0);
    if (cart.get(id)?.qty < 1) cart.delete(id);
  }
}

function renderStockPage() {
  const activeMenus = store.menus.filter(menu => menu.active !== false);
  const options = store.partners.map(partner => `<option value="${partner.id}">${escapeHtml(partner.name)}</option>`).join("");
  return `${pageHeading(profile.role === "spv" ? "Pemantauan stok" : "Menu & persediaan", "Lihat stok aktual, catat barang masuk, dan kelola katalog menu.", profile.role === "superadmin" ? `<button class="btn btn-primary" data-open-modal="menu">＋ Tambah menu</button>` : "")}
    ${profile.role === "superadmin" ? `<div class="content-grid equal"><section class="panel">${panelHeader("Catat stok masuk", "Tambahkan jumlah stok yang baru diterima dari mitra")}<form id="receive-stock-form"><div class="form-field"><label>Menu</label><select name="menuId" required><option value="">Pilih menu</option>${store.menus.map(menu => `<option value="${menu.id}">${escapeHtml(menu.name)} · stok ${integer(menu.stock)}</option>`).join("")}</select></div><div class="form-field"><label>Jumlah masuk</label><input type="number" name="qty" min="1" step="1" placeholder="Contoh: 20" required></div><div class="form-field"><label>Catatan (opsional)</label><input name="note" maxlength="160" placeholder="Contoh: pengiriman pagi"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Simpan stok masuk</button></div></form></section><section class="panel">${panelHeader("Tambah mitra baru", "Mitra harus terdaftar sebelum menu dibuat")}<p class="muted" style="font-size:11px;line-height:1.7">Tambahkan data mitra terlebih dahulu melalui halaman Manajemen Mitra. Setelah mitra dibuat, menu dapat dikaitkan ke mitra tersebut dan akun portalnya bisa dibuat melalui Akun Pengguna.</p><button class="btn btn-light" data-nav="partners">Buka manajemen mitra →</button></section></div>` : `<section class="panel" style="margin-bottom:15px">${panelHeader("Catat stok masuk", "SPV dapat menerima barang dan memperbarui stok aktual")}<form id="receive-stock-form" class="inline-form"><div class="form-field"><label>Menu</label><select name="menuId" required><option value="">Pilih menu</option>${store.menus.map(menu => `<option value="${menu.id}">${escapeHtml(menu.name)}</option>`).join("")}</select></div><div class="form-field"><label>Jumlah masuk</label><input name="qty" type="number" min="1" step="1" required placeholder="Jumlah"></div><div class="form-field"><label>Catatan</label><input name="note" maxlength="160" placeholder="Opsional"></div><button class="btn btn-primary" type="submit">Simpan stok</button></form></section>`}
    <section class="panel">${panelHeader("Stok menu", `${integer(activeMenus.length)} menu aktif`)}<div class="table-wrap"><table><thead><tr><th>Nama menu</th><th>Mitra</th><th>Kategori</th><th>Harga jual</th><th>Stok tersedia</th><th>Status</th>${profile.role === "superadmin" ? "<th>Aksi</th>" : ""}</tr></thead><tbody>${activeMenus.length ? activeMenus.map(menu => `<tr><td><strong>${escapeHtml(menu.name)}</strong></td><td>${escapeHtml(menu.partnerName || "—")}</td><td>${escapeHtml(menu.category || "—")}</td><td>${money(menu.price)}</td><td><strong>${integer(menu.stock)}</strong></td><td><span class="status ${Number(menu.stock) > 0 ? "success" : "inactive"}">${Number(menu.stock) > 0 ? "Tersedia" : "Habis"}</span></td>${profile.role === "superadmin" ? `<td><button class="action-link" data-edit-menu="${menu.id}">Edit</button></td>` : ""}</tr>`).join("") : `<tr><td colspan="7" class="table-empty">Belum ada menu.</td></tr>`}</tbody></table></div></section>`;
}

function renderPartnersPage() {
  return `${pageHeading("Manajemen mitra", "Kelola daftar mitra pemasok produk KALAP.", `<button class="btn btn-primary" data-open-modal="partner">＋ Tambah mitra</button>`)}
    <div class="info-banner"><span>ⓘ</span><div><strong>Alur akun mitra</strong><br>Daftarkan mitra di sini, tambahkan menu miliknya, lalu buat akun role Mitra pada halaman Akun Pengguna dengan memilih mitra yang sesuai.</div></div>
    <section class="panel">${panelHeader("Daftar mitra", `${integer(store.partners.length)} mitra terdaftar`)}<div class="table-wrap"><table><thead><tr><th>Nama mitra</th><th>Kontak</th><th>Jumlah menu</th><th>Status</th><th>Bergabung</th></tr></thead><tbody>${store.partners.length ? store.partners.map(partner => `<tr><td><strong>${escapeHtml(partner.name)}</strong></td><td>${escapeHtml(partner.phone || "—")}</td><td>${integer(store.menus.filter(menu => menu.partnerId === partner.id).length)} menu</td><td><span class="status ${partner.active === false ? "inactive" : "success"}">${partner.active === false ? "Nonaktif" : "Aktif"}</span></td><td>${formatDate(partner.createdAt)}</td></tr>`).join("") : `<tr><td colspan="5" class="table-empty">Belum ada mitra. Tambahkan mitra pertama untuk mulai mengelola katalog.</td></tr>`}</tbody></table></div></section>`;
}
function renderAccountsPage() {
  const partnerOptions = store.partners.filter(partner => partner.active !== false).map(partner => `<option value="${partner.id}">${escapeHtml(partner.name)}</option>`).join("");
  return `${pageHeading("Akun pengguna", "Superadmin menentukan role dan identitas setiap akun.", `<span class="status neutral">${integer(store.users.length)} akun</span>`)}
    <div class="content-grid"><section class="panel">${panelHeader("Buat akun baru", "Akun dibuat oleh superadmin melalui Firebase Authentication")}<form id="create-user-form"><div class="form-field"><label>Nama lengkap</label><input name="displayName" maxlength="80" required placeholder="Nama pengguna"></div><div class="form-field"><label>Email login</label><input name="email" type="email" required placeholder="nama@email.com"></div><div class="form-field"><label>Kata sandi awal</label><input name="password" type="password" minlength="8" required placeholder="Minimal 8 karakter"><div class="helper-text">Bagikan kata sandi awal secara pribadi. Pengguna dapat diarahkan untuk menggantinya setelah login.</div></div><div class="form-field"><label>Role akun</label><select name="role" id="new-user-role" required><option value="spv">SPV</option><option value="cashier">Kasir</option><option value="partner">Mitra</option></select></div><div class="form-field" id="partner-user-field" style="display:none"><label>Mitra terkait</label><select name="partnerId"><option value="">Pilih mitra</option>${partnerOptions}</select></div><div class="form-actions"><button class="btn btn-primary" type="submit">Buat akun</button></div></form></section>
    <section class="panel">${panelHeader("Hak akses tiap role", "Ringkasan pembagian kewenangan")}<div class="summary-list"><div class="summary-row"><span><strong>Superadmin</strong></span><span>Semua fitur & pengaturan</span></div><div class="summary-row"><span><strong>SPV</strong></span><span>Dashboard, stok, POS, riwayat</span></div><div class="summary-row"><span><strong>Kasir</strong></span><span>POS & riwayat transaksi</span></div><div class="summary-row"><span><strong>Mitra</strong></span><span>Menu dan penjualan miliknya</span></div><div class="summary-divider"></div><div class="helper-text">Tidak ada tombol pendaftaran publik. Pembuatan akun menggunakan sesi superadmin. Jangan aktifkan pendaftaran publik.</div></div></section></div>
    <section class="panel">${panelHeader("Akun terdaftar", "Akun yang memiliki akses ke sistem")}<div class="table-wrap"><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Mitra</th><th>Status</th></tr></thead><tbody>${store.users.map(user => `<tr><td><strong>${escapeHtml(user.displayName || user.name || "—")}</strong></td><td>${escapeHtml(user.email || "—")}</td><td><span class="status neutral">${ROLE_LABELS[user.role] || escapeHtml(user.role)}</span></td><td>${escapeHtml(store.partners.find(partner => partner.id === user.partnerId)?.name || "—")}</td><td><span class="status ${user.active === false ? "inactive" : "success"}">${user.active === false ? "Nonaktif" : "Aktif"}</span></td></tr>`).join("") || `<tr><td colspan="5" class="table-empty">Belum ada akun lain.</td></tr>`}</tbody></table></div></section>`;
}
function renderFinancePage() {
  const totalIn = store.cashflows.filter(row => row.type === "income").reduce((s,row)=>s+Number(row.amount||0),0);
  const totalOut = store.cashflows.filter(row => row.type === "expense").reduce((s,row)=>s+Number(row.amount||0),0);
  return `${pageHeading("Keuangan", "Catat pemasukan dan pengeluaran di luar transaksi penjualan.", selectedMonthControl())}
    <section class="stats-grid">${statCard("Total pemasukan", money(totalIn), "＋", "Penjualan + pemasukan manual")}${statCard("Total pengeluaran", money(totalOut), "−", "Catatan pengeluaran manual")}${statCard("Saldo arus kas", money(totalIn-totalOut), "◉", "Pemasukan dikurangi pengeluaran")}${statCard("Catatan keuangan", integer(store.cashflows.length), "▤", "Termasuk pencatatan otomatis penjualan")}</section>
    <div class="content-grid"><section class="panel">${panelHeader("Input manual", "Catat pemasukan atau pengeluaran lain")}<form id="finance-form"><div class="form-field"><label>Jenis catatan</label><select name="type"><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div><div class="form-field"><label>Jumlah (Rp)</label><input type="number" name="amount" min="1" step="1" required placeholder="Contoh: 150000"></div><div class="form-field"><label>Kategori</label><input name="category" maxlength="50" required placeholder="Contoh: listrik, belanja bahan"></div><div class="form-field"><label>Keterangan</label><textarea name="note" rows="2" maxlength="200" placeholder="Detail singkat transaksi"></textarea></div><div class="form-actions"><button class="btn btn-primary" type="submit">Simpan catatan</button></div></form></section>
    <section class="panel">${panelHeader("Ringkasan arus kas", `Bulan ${monthKey}`)}<div class="summary-list"><div class="summary-row"><span>Penjualan otomatis</span><strong>${money(sumBy(store.transactions,"total"))}</strong></div><div class="summary-row"><span>Pemasukan lain</span><strong>${money(store.cashflows.filter(r=>r.type==="income"&&r.source!=="sale").reduce((s,r)=>s+Number(r.amount||0),0))}</strong></div><div class="summary-row"><span>Pengeluaran</span><strong>${money(totalOut)}</strong></div><div class="summary-divider"></div><div class="summary-row"><span>Saldo tercatat</span><strong>${money(totalIn-totalOut)}</strong></div></div><div class="helper-text">Setiap transaksi kasir otomatis dicatat sebagai pemasukan penjualan. Jangan input ulang transaksi penjualan secara manual agar tidak terhitung dua kali.</div></section></div>
    <section class="panel">${panelHeader("Riwayat keuangan", `${integer(store.cashflows.length)} catatan bulan ini`)}<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Keterangan</th><th>Jumlah</th></tr></thead><tbody>${store.cashflows.slice().sort((a,b)=>asDate(b.createdAt)-asDate(a.createdAt)).map(row => `<tr><td>${formatDate(row.createdAt)} · ${formatTime(row.createdAt)}</td><td><span class="status ${row.type === "income" ? "success" : "inactive"}">${row.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></td><td>${escapeHtml(row.category || (row.source === "sale" ? "Penjualan" : "—"))}</td><td>${escapeHtml(row.note || (row.source === "sale" ? `Penjualan ${row.transactionCode || ""}` : "—"))}</td><td><strong>${money(row.amount)}</strong></td></tr>`).join("") || `<tr><td colspan="5" class="table-empty">Belum ada catatan keuangan.</td></tr>`}</tbody></table></div></section>`;
}

function renderRequestsPage() {
  const requests = store.stockRequests;
  const staffCanReceive = ["superadmin", "spv"].includes(profile.role);
  return `${pageHeading("Permintaan stok", "Permintaan pengiriman dari mitra dan status penerimaannya.", `<span class="status pending">${integer(requests.filter(row=>row.status==="pending").length)} menunggu</span>`)}
    <section class="panel">${panelHeader("Daftar permintaan", "Permintaan stok yang masuk dari portal mitra")}<div class="table-wrap"><table><thead><tr><th>Mitra</th><th>Menu</th><th>Jumlah diminta</th><th>Catatan</th><th>Tanggal</th><th>Status / aksi</th></tr></thead><tbody>${requests.map(row => `<tr><td><strong>${escapeHtml(row.partnerName || "Mitra")}</strong></td><td>${escapeHtml(row.menuName || "—")}</td><td>${integer(row.qty)} unit</td><td>${escapeHtml(row.note || "—")}</td><td>${formatDate(row.createdAt)}</td><td>${row.status === "pending" && staffCanReceive ? `<button class="action-link" data-accept-request="${row.id}">Terima & tambah stok</button>` : `<span class="status ${row.status === "pending" ? "pending" : "success"}">${row.status === "pending" ? "Menunggu" : "Diterima"}</span>`}</td></tr>`).join("") || `<tr><td colspan="6" class="table-empty">Belum ada permintaan stok.</td></tr>`}</tbody></table></div></section>`;
}
function renderPartnerHome() {
  const sales = store.partnerSales;
  const totalSales = sumBy(sales, "total");
  const sold = sales.reduce((sum,row)=>sum+Number(row.qty||0),0);
  const pending = store.stockRequests.filter(row => row.status === "pending").length;
  const stock = store.menus.reduce((sum,menu)=>sum+Number(menu.stock||0),0);
  return `${pageHeading(`Halo, ${escapeHtml(profile.displayName || "Mitra")}`, "Pantau performa produk dan persediaan milik mitra Anda.", `<span class="status success">Portal mitra</span>`)}
    <section class="stats-grid">${statCard("Penjualan bulan ini", money(totalSales), "↗", `${integer(sales.length)} transaksi tercatat`)}${statCard("Produk terjual", integer(sold), "▣", "Total unit produk Anda")}${statCard("Stok tersedia", integer(stock), "▤", "Akumulasi stok menu Anda")}${statCard("Permintaan menunggu", integer(pending), "＋", "Menunggu diproses tim KALAP")}</section>
    <section class="content-grid equal"><article class="panel">${panelHeader("Menu milik Anda", "Ringkasan produk yang dititipkan di KALAP", `<button class="panel-action" data-nav="partnerMenu">Lihat menu →</button>`)}<div class="summary-list">${store.menus.slice(0,5).map(menu=>`<div class="summary-row"><span>${escapeHtml(menu.name)}</span><strong>${integer(menu.stock)} stok</strong></div>`).join("") || `<div class="muted">Belum ada menu yang terdaftar.</div>`}</div></article><article class="panel">${panelHeader("Penjualan terbaru", "Transaksi atas produk Anda", `<button class="panel-action" data-nav="partnerSales">Lihat penjualan →</button>`)}<div class="summary-list">${sales.slice(0,5).map(row=>`<div class="summary-row"><span>${formatDate(row.createdAt)} · ${escapeHtml(row.transactionCode || "")}</span><strong>${money(row.total)}</strong></div>`).join("") || `<div class="muted">Belum ada penjualan.</div>`}</div></article></section>`;
}
function renderPartnerMenu() {
  return `${pageHeading("Menu saya", "Daftar produk milik Anda yang dijual melalui KALAP.")}
    <section class="panel">${panelHeader("Katalog produk", `${integer(store.menus.length)} menu terdaftar`)}<div class="table-wrap"><table><thead><tr><th>Nama menu</th><th>Kategori</th><th>Harga jual</th><th>Stok saat ini</th><th>Status</th></tr></thead><tbody>${store.menus.map(menu=>`<tr><td><strong>${escapeHtml(menu.name)}</strong></td><td>${escapeHtml(menu.category||"—")}</td><td>${money(menu.price)}</td><td><strong>${integer(menu.stock)}</strong></td><td><span class="status ${Number(menu.stock)>0?"success":"inactive"}">${Number(menu.stock)>0?"Tersedia":"Habis"}</span></td></tr>`).join("") || `<tr><td colspan="5" class="table-empty">Belum ada menu yang terhubung dengan akun ini.</td></tr>`}</tbody></table></div><div class="helper-text">Harga dan data menu dikelola oleh KALAP. Hubungi admin apabila ada perubahan nama, kategori, atau harga.</div></section>`;
}
function renderPartnerSales() {
  const total = sumBy(store.partnerSales,"total");
  return `${pageHeading("Penjualan saya", "Riwayat penjualan yang berasal dari produk milik Anda.", selectedMonthControl())}
    <section class="stats-grid">${statCard("Nilai penjualan", money(total), "↗", `Periode ${monthKey}`)}${statCard("Jumlah transaksi", integer(store.partnerSales.length), "▣", "Transaksi yang memuat produk Anda")}${statCard("Unit terjual", integer(store.partnerSales.reduce((s,r)=>s+Number(r.qty||0),0)), "＋", "Akumulasi unit produk terjual")}${statCard("Status pencatatan", "Realtime", "◉", "Data tersinkron otomatis")}</section>
    <section class="panel">${panelHeader("Riwayat penjualan", `${integer(store.partnerSales.length)} catatan pada bulan ${monthKey}`)}<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Kode transaksi</th><th>Produk & jumlah</th><th>Metode bayar</th><th>Total penjualan</th></tr></thead><tbody>${store.partnerSales.map(row=>`<tr><td>${formatDate(row.createdAt)} · ${formatTime(row.createdAt)}</td><td><strong>${escapeHtml(row.transactionCode||"—")}</strong></td><td>${(row.items||[]).map(item=>`${escapeHtml(item.name)} (${integer(item.qty)}x)`).join(", ")}</td><td>${escapeHtml((row.paymentMethod||"—").toUpperCase())}</td><td><strong>${money(row.total)}</strong></td></tr>`).join("") || `<tr><td colspan="5" class="table-empty">Belum ada penjualan untuk periode ini.</td></tr>`}</tbody></table></div></section>`;
}

function attachPageEvents() {
  $("#month-select")?.addEventListener("change", event => {
    const value = event.target.value;
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    subscribeMonthData(value);
  });
  $("#chart-days")?.addEventListener("input", event => {
    chartDays = Number(event.target.value);
    $("#chart-days-label").textContent = `${chartDays} hari`;
    destroyCharts(); mountSuperadminCharts();
  });
  $("#history-date")?.addEventListener("change", event => {
    const value = event.target.value;
    if (!value) return;
    historyDate = value;
    const newMonth = value.slice(0, 7);
    if (newMonth !== monthKey) subscribeMonthData(newMonth);
    else renderPage();
  });
  $("#new-user-role")?.addEventListener("change", event => {
    const field = $("#partner-user-field");
    if (field) field.style.display = event.target.value === "partner" ? "block" : "none";
  });
  $("#create-user-form")?.addEventListener("submit", createUserSubmit);
  $("#create-partner-form")?.addEventListener("submit", createPartnerSubmit);
  $("#create-menu-form")?.addEventListener("submit", createMenuSubmit);
  $("#receive-stock-form")?.addEventListener("submit", receiveStockSubmit);
  $("#finance-form")?.addEventListener("submit", financeSubmit);
  $("#stock-request-form")?.addEventListener("submit", stockRequestSubmit);
  $("#checkout-btn")?.addEventListener("click", checkout);
  $("#clear-cart-btn")?.addEventListener("click", () => { cart.clear(); renderPage(); });
  $$('[data-add-menu]').forEach(button => button.addEventListener("click", () => addToCart(button.dataset.addMenu)));
  $$('[data-cart-inc]').forEach(button => button.addEventListener("click", () => changeCart(button.dataset.cartInc, 1)));
  $$('[data-cart-dec]').forEach(button => button.addEventListener("click", () => changeCart(button.dataset.cartDec, -1)));
  $$('[data-open-modal]').forEach(button => button.addEventListener("click", () => openManagementModal(button.dataset.openModal)));
  $$('[data-edit-menu]').forEach(button => button.addEventListener("click", () => editMenu(button.dataset.editMenu)));
  $$('[data-accept-request]').forEach(button => button.addEventListener("click", () => acceptStockRequest(button.dataset.acceptRequest, button)));
  $$('[data-detail-tx]').forEach(button => button.addEventListener("click", () => showTransactionDetail(button.dataset.detailTx)));
  $$('[data-nav]').forEach(button => button.addEventListener("click", () => showPage(button.dataset.nav)));
}

function addToCart(menuId) {
  const menu = store.menus.find(item => item.id === menuId);
  if (!menu || Number(menu.stock || 0) < 1) return toast("Stok menu habis.", "error");
  const current = cart.get(menuId);
  if (current && current.qty >= Number(menu.stock)) return toast("Jumlah melebihi stok yang tersedia.", "error");
  cart.set(menuId, { menuId, name: menu.name, price: Number(menu.price), qty: (current?.qty || 0) + 1 });
  renderPage();
}
function changeCart(menuId, delta) {
  const row = cart.get(menuId);
  const menu = store.menus.find(item => item.id === menuId);
  if (!row || !menu) return;
  const next = row.qty + delta;
  if (next <= 0) cart.delete(menuId);
  else if (next > Number(menu.stock || 0)) return toast("Jumlah melebihi stok yang tersedia.", "error");
  else row.qty = next;
  renderPage();
}
async function checkout() {
  if (busy || !cart.size) return;
  const button = $("#checkout-btn");
  busy = true; setBusy(button, true);
  try {
    const paymentMethod = $("#payment-method")?.value || "cash";
    const payload = { items: [...cart.values()].map(row => ({ menuId: row.menuId, qty: row.qty })), paymentMethod };
    const result = await callApi("createSale", payload);
    cart.clear();
    toast("Transaksi berhasil disimpan.", "success");
    renderPage();
    showReceipt(result);
  } catch (error) { toast(friendlyError(error), "error"); }
  finally { busy = false; }
}
function showReceipt(result) {
  const modal = $("#modal-root");
  modal.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Transaksi berhasil</h2><p>${escapeHtml(result.transactionCode || "")}</p></div><button class="modal-close" data-close-modal>×</button></div><div class="receipt-box"><h3>KALAP.</h3>${(result.items||[]).map(item=>`<div class="receipt-line"><span>${escapeHtml(item.name)} × ${integer(item.qty)}</span><strong>${money(item.subtotal)}</strong></div>`).join("")}<div class="receipt-line receipt-total"><span>Total</span><strong>${money(result.total)}</strong></div><div class="receipt-line"><span>Metode pembayaran</span><strong>${escapeHtml((result.paymentMethod||"").toUpperCase())}</strong></div></div><div class="form-actions"><button class="btn btn-primary" data-close-modal>Selesai</button></div></section></div>`;
  modal.querySelectorAll("[data-close-modal]").forEach(item=>item.addEventListener("click", event=>{ if(event.target===item || item.tagName==="BUTTON") modal.innerHTML=""; }));
}

function showTransactionDetail(transactionId) {
  const tx = store.transactions.find(item => item.id === transactionId);
  if (!tx) return toast("Detail transaksi tidak ditemukan pada periode ini.", "error");
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-backdrop" data-detail-backdrop><section class="modal"><div class="modal-head"><div><h2>Detail transaksi</h2><p>${escapeHtml(tx.transactionCode || tx.id)} · ${formatDate(tx.createdAt)} ${formatTime(tx.createdAt)}</p></div><button class="modal-close" data-detail-close>×</button></div><div class="receipt-box"><div class="receipt-line"><span>Kasir</span><strong>${escapeHtml(tx.cashierName || "—")}</strong></div><div class="receipt-line"><span>Pembayaran</span><strong>${escapeHtml((tx.paymentMethod || "").toUpperCase())}</strong></div>${(tx.items || []).map(item=>`<div class="receipt-line" style="align-items:flex-start"><span><strong>${escapeHtml(item.name)}</strong><br>${integer(item.qty)} × ${money(item.price)}<br><small>Stok: ${integer(item.stockBefore)} → ${integer(item.stockAfter)}</small></span><strong>${money(item.subtotal)}</strong></div>`).join("")}<div class="receipt-line receipt-total"><span>Total</span><strong>${money(tx.total)}</strong></div></div><div class="form-actions"><button class="btn btn-primary" data-detail-close>Tutup</button></div></section></div>`;
  root.querySelectorAll("[data-detail-close], [data-detail-backdrop]").forEach(item=>item.addEventListener("click",event=>{if(event.target===item||item.matches("[data-detail-close]"))root.innerHTML="";}));
}

function openManagementModal(type) {
  const root = $("#modal-root");
  if (type === "partner") {
    root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal"><div class="modal-head"><div><h2>Tambah mitra</h2><p>Masukkan identitas mitra pemasok KALAP.</p></div><button class="modal-close" data-modal-close>×</button></div><form id="create-partner-form"><div class="form-field"><label>Nama mitra / usaha</label><input name="name" required maxlength="80" placeholder="Nama pemilik atau usaha"></div><div class="form-field"><label>Nomor WhatsApp</label><input name="phone" maxlength="30" placeholder="08xxxxxxxxxx"></div><div class="form-field"><label>Catatan</label><textarea name="note" maxlength="180" rows="2" placeholder="Catatan opsional"></textarea></div><div class="form-actions"><button type="button" class="btn btn-light" data-modal-close>Batal</button><button class="btn btn-primary" type="submit">Simpan mitra</button></div></form></section></div>`;
    root.querySelector("#create-partner-form").addEventListener("submit", createPartnerSubmit);
  } else if (type === "menu") {
    root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal"><div class="modal-head"><div><h2>Tambah menu</h2><p>Menu dikaitkan dengan satu mitra pemasok.</p></div><button class="modal-close" data-modal-close>×</button></div><form id="create-menu-form"><div class="form-field"><label>Nama menu</label><input name="name" required maxlength="80" placeholder="Contoh: Nasi ayam"></div><div class="form-field"><label>Mitra pemasok</label><select name="partnerId" required><option value="">Pilih mitra</option>${store.partners.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div><div class="form-field"><label>Kategori</label><input name="category" maxlength="40" placeholder="Makanan / Minuman"></div><div class="form-field"><label>Harga jual (Rp)</label><input name="price" type="number" min="1" step="1" required placeholder="Contoh: 15000"></div><div class="helper-text">Stok awal dimulai dari 0. Catat jumlah barang yang diterima melalui menu Persediaan.</div><div class="form-actions"><button type="button" class="btn btn-light" data-modal-close>Batal</button><button class="btn btn-primary" type="submit">Simpan menu</button></div></form></section></div>`;
    root.querySelector("#create-menu-form").addEventListener("submit", createMenuSubmit);
  }
  root.querySelectorAll("[data-modal-close], [data-modal-backdrop]").forEach(item=>item.addEventListener("click", event=>{ if(event.target===item || item.matches("[data-modal-close]")) root.innerHTML=""; }));
}
function editMenu(menuId) {
  const menu = store.menus.find(item=>item.id===menuId);
  if (!menu) return;
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal"><div class="modal-head"><div><h2>Edit menu</h2><p>Perubahan harga dan status berlaku setelah disimpan.</p></div><button class="modal-close" data-modal-close>×</button></div><form id="edit-menu-form"><div class="form-field"><label>Nama menu</label><input name="name" value="${escapeHtml(menu.name)}" maxlength="80" required></div><div class="form-field"><label>Kategori</label><input name="category" value="${escapeHtml(menu.category||"")}" maxlength="40"></div><div class="form-field"><label>Harga jual (Rp)</label><input name="price" type="number" min="1" value="${Number(menu.price)}" required></div><div class="form-field"><label>Status</label><select name="active"><option value="true" ${menu.active!==false?"selected":""}>Aktif</option><option value="false" ${menu.active===false?"selected":""}>Nonaktif</option></select></div><div class="form-actions"><button type="button" class="btn btn-light" data-modal-close>Batal</button><button class="btn btn-primary" type="submit">Simpan perubahan</button></div></form></section></div>`;
  root.querySelector("#edit-menu-form").addEventListener("submit", async event=>{
    event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); setBusy(button,true);
    try { const data=Object.fromEntries(new FormData(form)); await callApi("updateMenu", { menuId, name:data.name, category:data.category, price:Number(data.price), active:data.active==="true" }); root.innerHTML=""; toast("Menu berhasil diperbarui.","success"); }
    catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
  });
  root.querySelectorAll("[data-modal-close], [data-modal-backdrop]").forEach(item=>item.addEventListener("click",event=>{if(event.target===item||item.matches("[data-modal-close]"))root.innerHTML="";}));
}

async function createPartnerSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); setBusy(button,true);
  try { const data=Object.fromEntries(new FormData(form)); await callApi("createPartner", data); $("#modal-root").innerHTML=""; toast("Mitra berhasil ditambahkan.","success"); if(activePage!=="partners") showPage("partners"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function createMenuSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); setBusy(button,true);
  try { const data=Object.fromEntries(new FormData(form)); await callApi("createMenu", {...data,price:Number(data.price)}); $("#modal-root").innerHTML=""; toast("Menu berhasil ditambahkan.","success"); if(activePage!=="stock") showPage("stock"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function createUserSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); const data=Object.fromEntries(new FormData(form));
  if(data.role==="partner"&&!data.partnerId) return toast("Pilih mitra untuk akun dengan role Mitra.","error");
  setBusy(button,true);
  try { await callApi("createManagedUser", data); form.reset(); $("#partner-user-field").style.display="none"; toast("Akun berhasil dibuat. Sampaikan email dan kata sandi awal kepada pengguna.","success"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function receiveStockSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); const data=Object.fromEntries(new FormData(form));
  if(!Number.isInteger(Number(data.qty))||Number(data.qty)<1) return toast("Jumlah stok harus bilangan bulat lebih dari 0.","error");
  setBusy(button,true);
  try { await callApi("receiveStock", {menuId:data.menuId,qty:Number(data.qty),note:data.note||""}); form.reset(); toast("Stok masuk berhasil dicatat.","success"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function financeSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); const data=Object.fromEntries(new FormData(form));
  setBusy(button,true);
  try { await callApi("createFinanceEntry", {...data,amount:Number(data.amount)}); form.reset(); toast("Catatan keuangan berhasil disimpan.","success"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function stockRequestSubmit(event) {
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector("button[type=submit]"); const data=Object.fromEntries(new FormData(form));
  setBusy(button,true);
  try { await callApi("createStockRequest", {...data,qty:Number(data.qty)}); form.reset(); toast("Permintaan stok dikirim ke tim KALAP.","success"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}
async function acceptStockRequest(requestId, button) {
  const request = store.stockRequests.find(item=>item.id===requestId);
  if(!request||request.status!=="pending") return;
  setBusy(button,true,"Menyimpan...");
  try { await callApi("receiveStock", {menuId:request.menuId,qty:Number(request.qty),note:`Penerimaan permintaan mitra ${request.partnerName||""}`,requestId}); toast("Permintaan diterima dan stok diperbarui.","success"); }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
}

function renderStockRequestForm() {
  const options=store.menus.map(menu=>`<option value="${menu.id}">${escapeHtml(menu.name)} · stok ${integer(menu.stock)}</option>`).join("");
  return `<section class="panel" style="margin-bottom:15px">${panelHeader("Ajukan pengiriman stok", "Permintaan akan diterima oleh tim operasional KALAP")}<form id="stock-request-form" class="inline-form"><div class="form-field"><label>Menu</label><select name="menuId" required><option value="">Pilih menu</option>${options}</select></div><div class="form-field"><label>Jumlah</label><input name="qty" type="number" min="1" step="1" required placeholder="Jumlah unit"></div><div class="form-field"><label>Catatan</label><input name="note" maxlength="160" placeholder="Contoh: siap dikirim jam 08.00"></div><button type="submit" class="btn btn-primary">Kirim permintaan</button></form></section>`;
}
// Override request view with a role-appropriate form for partner users.
function renderPartnerRequestsPage() {
  const requests=store.stockRequests;
  return `${pageHeading("Permintaan stok", "Ajukan stok tambahan dan pantau status penerimaannya.")}${renderStockRequestForm()}<section class="panel">${panelHeader("Riwayat permintaan", `${integer(requests.length)} permintaan tercatat`)}<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Menu</th><th>Jumlah</th><th>Catatan</th><th>Status</th></tr></thead><tbody>${requests.map(row=>`<tr><td>${formatDate(row.createdAt)}</td><td><strong>${escapeHtml(row.menuName||"—")}</strong></td><td>${integer(row.qty)} unit</td><td>${escapeHtml(row.note||"—")}</td><td><span class="status ${row.status==="pending"?"pending":"success"}">${row.status==="pending"?"Menunggu":"Diterima"}</span></td></tr>`).join("")||`<tr><td colspan="5" class="table-empty">Belum ada permintaan stok.</td></tr>`}</tbody></table></div></section>`;
}

// Route request pages according to role.
const _renderPage = renderPage;
renderPage = function() {
  if (profile && profile.role === "partner" && activePage === "requests") {
    renderNav(); $("#breadcrumb-current").textContent="Permintaan stok"; destroyCharts(); $("#page-content").innerHTML=renderPartnerRequestsPage(); attachPageEvents(); return;
  }
  return _renderPage();
};

// Global interactions
$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!isFirebaseConfigured) return;
  const button=$("#login-submit"); setBusy(button,true,"Memeriksa...");
  try { await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-password").value); $("#login-password").value=""; }
  catch(error){toast(friendlyError(error),"error");} finally{setBusy(button,false);}
});
$("#toggle-password").addEventListener("click",()=>{
  const field=$("#login-password"); const shown=field.type==="text"; field.type=shown?"password":"text"; $("#toggle-password").textContent=shown?"Lihat":"Sembunyi";
});
$("#logout-btn").addEventListener("click",async()=>{if(auth)await signOut(auth);});
$("#mobile-menu-btn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",event=>{
  const sidebar=$("#sidebar");
  if(window.innerWidth<=760 && sidebar.classList.contains("open") && !sidebar.contains(event.target) && !$("#mobile-menu-btn").contains(event.target)) sidebar.classList.remove("open");
});

let lastJakartaDay = jakartaDateKey(new Date());
setInterval(() => {
  updateClockLabels();
  const currentDay = jakartaDateKey(new Date());
  if (currentDay !== lastJakartaDay) {
    lastJakartaDay = currentDay;
    historyDate = currentDay;
    const currentMonth = currentDay.slice(0, 7);
    if (profile && currentMonth !== monthKey) subscribeMonthData(currentMonth);
    else if (profile && ["dashboard", "transactions", "partnerHome"].includes(activePage)) renderPage();
  }
}, 60000);

startApp();
