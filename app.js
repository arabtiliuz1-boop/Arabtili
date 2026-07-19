// ---------- Supabase ulanishi ----------
// SUPABASE_ANON_KEY frontendda ko'rinishi mumkin bo'lgan ochiq kalit —
// haqiqiy himoya Supabase'dagi Row Level Security orqali ta'minlanadi.
const SUPABASE_URL = "https://wtjgrdotrksduhliwjdt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0amdyZG90cmtzZHVobGl3amR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzE3NzYsImV4cCI6MjA5OTYwNzc3Nn0.EePO8zb9g-0NKpbKPKQ_1sExFVrbkPjo2cZH--WEQfE";

const supabaseClient = (typeof window.supabase !== "undefined")
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ---------- Har bir brauzer uchun tasodifiy kalit (login tizimi hali yo'q) ----------
function getDeviceKey() {
  let key = localStorage.getItem("platform_device_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("platform_device_key", key);
  }
  return key;
}

// ---------- Bo'limga kirish huquqini tekshirish ----------
async function checkSectionAccess(sectionId) {
  if (!supabaseClient) return false;
  try {
    const { data, error } = await supabaseClient.rpc("has_section_access", {
      p_device_key: getDeviceKey(),
      p_section_id: sectionId,
    });
    if (error) {
      console.error("checkSectionAccess error:", error);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error("checkSectionAccess exception:", err);
    return false;
  }
}

// ---------- Kirish kodini tekshirib, kirish huquqini berish ----------
async function redeemAccessCode(code) {
  if (!supabaseClient) {
    return { success: false, message: "Ulanishda xatolik. Sahifani qayta yuklang." };
  }
  try {
    const { data, error } = await supabaseClient.rpc("redeem_access_code", {
      p_code: code.trim(),
      p_device_key: getDeviceKey(),
    });
    if (error) {
      console.error("redeemAccessCode error:", error);
      return { success: false, message: "Xatolik yuz berdi. Qayta urinib ko'ring." };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return row || { success: false, message: "Xatolik yuz berdi." };
  } catch (err) {
    console.error("redeemAccessCode exception:", err);
    return { success: false, message: "Internet aloqasini tekshiring." };
  }
}

// ---------- Gate sahifasini boshqarish (grammatika/multilevel/kurs) ----------
function initGate(sectionId) {
  const gateEl = document.querySelector(".gate");
  const unlockedEl = document.querySelector(".unlocked-state");
  const form = document.getElementById("access-form");
  const input = document.getElementById("access-code-input");
  const msg = document.getElementById("access-msg");

  function showUnlocked() {
    if (gateEl) gateEl.style.display = "none";
    if (unlockedEl) unlockedEl.style.display = "block";
  }

  checkSectionAccess(sectionId).then((hasAccess) => {
    if (hasAccess) showUnlocked();
  });

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      msg.textContent = "Tekshirilmoqda...";
      msg.className = "gate-msg";

      const result = await redeemAccessCode(input.value);

      submitBtn.disabled = false;
      if (result.success) {
        msg.textContent = "Muvaffaqiyatli! Ochilmoqda...";
        msg.className = "gate-msg ok";
        setTimeout(showUnlocked, 600);
      } else {
        msg.textContent = result.message || "Kod noto'g'ri.";
        msg.className = "gate-msg error";
      }
    });
  }
}
