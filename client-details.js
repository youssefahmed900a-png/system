// 1. تأكد من وضع رابط ومفتاح Supabase الخاص بك هنا
const SUPABASE_URL = 'https://qhckkhonmmkqlibtvopx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I3m1QG_iZL01abbODbY3sw_itf29ApA';

// إنشاء الاتصال
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// 2. قراءة الـ id من رابط الصفحة
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('id');

if (!clientId) {
    alert("لم يتم تحديد عميل!");
    window.location.href = "ngm.html";
} else {
    loadClientData(clientId);
}

// 3. دالة جلب بيانات العميل والتحديثات
async function loadClientData(id) {
    try {
        // جلب بيانات العميل من Supabase
        const { data: client, error: clientErr } = await db
            .from("clients")
            .select("*")
            .eq("id", id)
            .single();

        if (clientErr) throw clientErr;

        // عرض بيانات العميل بأسماء الأعمدة المظبوطة
        document.getElementById("clientCard").innerHTML = `
            <div class="row g-3 p-3 bg-light rounded border">
                <div class="col-md-6"><strong>كود العميل:</strong> ${client.client_code || client.id}</div>
                <div class="col-md-6"><strong>اسم العميل:</strong> ${client.name || 'غير محدد'}</div>
                <div class="col-md-6"><strong>رقم الهاتف:</strong> ${client.phone || '-'}</div>
                <div class="col-md-6"><strong>رقم الشقة:</strong> ${client.apt_number || '-'}</div>
                <div class="col-md-6"><strong>الموقع:</strong> ${client.location || '-'}</div>
                <div class="col-md-6"><strong>المرحلة الحالية:</strong> ${client.current_stage || '-'}</div>
                <div class="col-md-6"><strong>نسبة الإنجاز:</strong> ${client.progress || 0}%</div>
                <div class="col-md-6"><strong>الحالة:</strong> ${client.status || '-'}</div>
            </div>
        `;

        // جلب التحديثات اليومية المرتبطة بهذا العميل
        const { data: updates, error: updateErr } = await db
            .from("daily_updates")
            .select("*")
            .eq("client_id", id)
            .order("created_at", { ascending: false });

        if (updateErr) throw updateErr;

        const updatesList = document.getElementById("updatesList");

        if (!updates || updates.length === 0) {
            updatesList.innerHTML = `<p class="text-muted mb-0 p-2">لا توجد تحديثات يومية مسجلة لهذا العميل حتى الآن.</p>`;
            return;
        }

        // استبدال الجزء الذي يعرض التحديثات بهذا الكود:
updatesList.innerHTML = updates.map(u => `
    <div class="border rounded p-3 mb-2 bg-white shadow-sm d-flex justify-content-between align-items-start" id="update-box-${u.id}">
        <div>
            <span class="badge bg-primary mb-2">${new Date(u.update_date || u.created_at).toLocaleDateString('ar-EG')}</span>
            <p class="mb-1 text-dark" id="notes-text-${u.id}">${u.notes || 'لا توجد ملاحظات'}</p>
            ${u.media_url ? `<a href="${u.media_url}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">👁️ عرض المرفق</a>` : ''}
        </div>
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" onclick="editUpdate('${u.id}', '${encodeURIComponent(u.notes || '')}')">✏️ تعديل</button>
            <button class="btn btn-outline-danger" onclick="deleteUpdate('${u.id}')">🗑️ حذف</button>
        </div>
    </div>
`).join('');

    } catch (err) {
        console.error("خطأ:", err);
        document.getElementById("clientCard").innerHTML = `<div class="alert alert-danger">حدث خطأ أثناء تحميل البيانات: ${err.message}</div>`;
    }
}














async function deleteUpdate(updateId) {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا التحديث اليومي؟")) return;

    try {
        const { error } = await db
            .from("daily_updates")
            .delete()
            .eq("id", updateId);

        if (error) throw error;

        alert("تم حذف التحديث بنجاح!");
        // إعادة تحميل البيانات للعميل الحالي
        loadClientData(clientId);
    } catch (err) {
        alert("فشل حذف التحديث: " + err.message);
    }
}
async function editUpdate(updateId, currentNotesEncoded) {
    const currentNotes = decodeURIComponent(currentNotesEncoded);
    const newNotes = prompt("تعديل ملاحظات التحديث اليومي:", currentNotes);

    // إذا تم إلغاء النافذة أو لم يتم تغيير النص
    if (newNotes === null || newNotes.trim() === currentNotes) return;

    try {
        const { error } = await db
            .from("daily_updates")
            .update({ notes: newNotes.trim() })
            .eq("id", updateId);

        if (error) throw error;

        alert("تم تحديث الملاحظات بنجاح!");
        // إعادة تحميل البيانات
        loadClientData(clientId);
    } catch (err) {
        alert("فشل تعديل التحديث: " + err.message);
    }
}




// فتح نافذة رفع التقرير
function openUploadReportModal() {
    const modal = new bootstrap.Modal(document.getElementById("uploadReportModal"));
    modal.show();
}

// معالجة فورمة الرفع
document.getElementById("uploadReportForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("reportTitle").value;
    const fileInput = document.getElementById("reportPdfFile");
    const file = fileInput.files[0];

    if (!file) return alert("يرجى اختيار ملف PDF!");

    try {
        // 1. رفع الملف إلى Supabase Storage (في باكت اسمها reports)
        const fileName = `${Date.now()}_${file.name}`;
        const { data: storageData, error: storageErr } = await db.storage
            .from("reports")
            .upload(fileName, file);

        if (storageErr) throw storageErr;

        // جلب الرابط العام للملف
        const { data: publicUrlData } = db.storage
            .from("reports")
            .getPublicUrl(fileName);

        const pdfUrl = publicUrlData.publicUrl;

        // 2. تسجيل التقرير في داتابيز Supabase
        const { error: dbErr } = await db
            .from("reports")
            .insert([{ client_id: clientId, title: title, pdf_url: pdfUrl }]);

        if (dbErr) throw dbErr;

        alert("تم رفع تقرير الـ PDF بنجاح!");
        location.reload();
    } catch (err) {
        alert("حدث خطأ أثناء الرفع: " + err.message);
    }
});