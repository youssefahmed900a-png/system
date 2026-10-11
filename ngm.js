// ==========================================
// 1. تهيئة Supabase Client باسم متغير "db" لتفادي التعارض
// ==========================================
const SUPABASE_URL = 'https://qhckkhonmmkqlibtvopx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I3m1QG_iZL01abbODbY3sw_itf29ApA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedMediaFile = null;

// ==========================================
// 2. الأحداث عند تحميل الصفحة
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    fetchClients();
    fetchDailyUpdates();

    // ربط زر إضافة العميل بفتح النافذة المنبثقة بآمان
    const addClientBtn = document.getElementById("addClientBtn");
    if (addClientBtn) {
        addClientBtn.addEventListener("click", openAddClientModal);
    }

    setupActionButtons();

    const updateDateInput = document.getElementById("updateDate");
    if (updateDateInput) {
        updateDateInput.valueAsDate = new Date();
    }
});

// ==========================================
// 3. أزرار الإجراءات
// ==========================================
function setupActionButtons() {
    const addUpdateBtn = document.getElementById("addUpdateBtn");
    if (addUpdateBtn) {
        addUpdateBtn.addEventListener("click", openUpdateModal);
    }

    const updateModalCloseBtn = document.querySelector("#updateModal .close-btn");
    if (updateModalCloseBtn) {
        updateModalCloseBtn.addEventListener("click", closeUpdateModal);
    }
}

// ==========================================
// 4. جلب وعرض بيانات العملاء
// ==========================================
async function fetchClients() {
    try {
        const { data: clients, error } = await db
            .from("clients")
            .select("*");

        if (error) throw error;

        if (clients) {
            updateStats(clients);

            const pendingClients = clients.filter(c => c.status === "قيد التنفيذ");
            const completedClients = clients.filter(c => c.status === "مكتمل");

            renderTable("pendingClientsTbody", pendingClients);
            renderTable("completedClientsTbody", completedClients);
            populateClientSelect(clients);
        }

    } catch (err) {
        console.error("خطأ أثناء جلب بيانات العملاء:", err.message);
    }
}

function updateStats(clients) {
    const total = clients.length;
    const pending = clients.filter(c => c.status === "قيد التنفيذ").length;
    const completed = clients.filter(c => c.status === "مكتمل").length;

    document.getElementById("totalClientsCount").textContent = total;
    document.getElementById("pendingClientsCount").textContent = pending;
    document.getElementById("completedClientsCount").textContent = completed;
}

function renderTable(tbodyId, clients) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";

    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">لا توجد بيانات للعرض</td></tr>`;
        return;
    }

    clients.forEach(client => {
        const row = document.createElement("tr");

        // 👈 الكود الجديد: إمكانية الضغط على السطر للانتقال لصفحة التفاصيل
        row.style.cursor = "pointer";
        row.addEventListener("click", (e) => {
            // التأكد من أن الضغط لم يكن على أزرار "تعديل" أو "حذف"
            if (!e.target.closest("button")) {
                window.location.href = `client-details.html?id=${client.id}`;
            }
        });

        row.innerHTML = `
            <td>${client.client_code || client.id}</td>
            <td>${client.name}</td>
            <td>${client.phone || '-'}</td>
            <td>${client.apt_number || '-'}</td>
            <td>${client.location || '-'}</td>
            <td>${client.current_stage || '-'}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${client.progress || 0}%</span>
                    <progress value="${client.progress || 0}" max="100" style="width: 60px;"></progress>
                </div>
            </td>
            <td><span class="status-badge ${client.status === 'مكتمل' ? 'status-completed' : 'status-pending'}">${client.status}</span></td>
            <td style="text-align: center;" class="actions-cell"></td>
        `;

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm";
        editBtn.innerHTML = "✏️ تعديل";
        editBtn.addEventListener("click", () => openEditModal(client));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.style.marginRight = "5px";
        deleteBtn.innerHTML = "🗑️ حذف";
        deleteBtn.addEventListener("click", () => deleteClient(client.id));

        const actionsCell = row.querySelector(".actions-cell");
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        tbody.appendChild(row);
    });
}

function populateClientSelect(clients) {
    const select = document.getElementById("updateClientSelect");
    if (!select) return;
    select.innerHTML = `<option value="">-- اختر العميل --</option>`;

    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = `${client.name} - شقة (${client.apt_number || 'غير محدد'})`;
        select.appendChild(option);
    });
}

// ==========================================
// 5. إضافة عميل جديد (Modal)
// ==========================================
function openAddClientModal() {
    document.getElementById("addClientModal").style.display = "block";
}

function closeAddClientModal() {
    document.getElementById("addClientModal").style.display = "none";
    document.getElementById("addClientForm").reset();
}

async function saveNewClient(event) {
    event.preventDefault();

    const newClient = {
        name: document.getElementById("addName").value,
        phone: document.getElementById("addPhone").value,
        apt_number: document.getElementById("addApt").value,
        location: document.getElementById("addLocation").value,
        current_stage: document.getElementById("addStage").value,
        progress: parseInt(document.getElementById("addProgress").value),
        status: document.getElementById("addStatus").value
    };

    try {
        const { error } = await db.from("clients").insert([newClient]);
        if (error) throw error;

        alert("تمت إضافة العميل بنجاح!");
        closeAddClientModal();
        fetchClients();
    } catch (err) {
        alert("حدث خطأ أثناء حفظ العميل: " + err.message);
    }
}

// ==========================================
// 6. تعديل بيانات العميل
// ==========================================
function openEditModal(client) {
    document.getElementById("editClientId").value = client.id;
    document.getElementById("editName").value = client.name || '';
    document.getElementById("editPhone").value = client.phone || '';
    document.getElementById("editApt").value = client.apt_number || '';
    document.getElementById("editLocation").value = client.location || '';
    document.getElementById("editStage").value = client.current_stage || '';
    document.getElementById("editProgress").value = client.progress || 0;
    document.getElementById("editStatus").value = client.status || 'قيد التنفيذ';

    document.getElementById("editClientModal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("editClientModal").style.display = "none";
}

async function saveClientEdits(event) {
    event.preventDefault();

    const id = document.getElementById("editClientId").value;
    const updatedData = {
        name: document.getElementById("editName").value,
        phone: document.getElementById("editPhone").value,
        apt_number: document.getElementById("editApt").value,
        location: document.getElementById("editLocation").value,
        current_stage: document.getElementById("editStage").value,
        progress: parseInt(document.getElementById("editProgress").value),
        status: document.getElementById("editStatus").value,
    };

    try {
        const { error } = await db
            .from("clients")
            .update(updatedData)
            .eq("id", id);

        if (error) throw error;

        alert("تم حفظ التعديلات بنجاح!");
        closeEditModal();
        fetchClients();
    } catch (err) {
        alert("حدث خطأ أثناء حفظ التعديلات: " + err.message);
    }
}

async function deleteClient(clientId) {
    if (!clientId || clientId === "undefined") {
        alert("خطأ: لا يوجد معرف (ID) صالح لهذا العميل!");
        return;
    }

    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا العميل؟")) return;

    try {
        const { error } = await db
            .from("clients")
            .delete()
            .eq("id", clientId);

        if (error) throw error;

        alert("تم حذف العميل بنجاح.");
        fetchClients();
    } catch (err) {
        alert("حدث خطأ أثناء الحذف: " + err.message);
    }
}

// ==========================================
// 7. التحديثات اليومية
// ==========================================
function openUpdateModal() {
    document.getElementById("updateModal").style.display = "block";
}

function closeUpdateModal() {
    document.getElementById("updateModal").style.display = "none";
    document.getElementById("dailyUpdateForm").reset();
    document.getElementById("mediaPreview").style.display = "none";
    document.getElementById("mediaPreview").innerHTML = "";
    selectedMediaFile = null;
}

function handleMediaPreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById("mediaPreview");
    previewContainer.innerHTML = "";

    if (file) {
        selectedMediaFile = file;
        const fileURL = URL.createObjectURL(file);
        
        if (file.type.startsWith("image/")) {
            previewContainer.innerHTML = `<img src="${fileURL}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
        } else if (file.type.startsWith("video/")) {
            previewContainer.innerHTML = `<video src="${fileURL}" controls style="max-width: 100%; max-height: 150px; border-radius: 8px;"></video>`;
        }
        previewContainer.style.display = "block";
    }
}

async function saveDailyUpdate(event) {
    event.preventDefault();

    const clientId = document.getElementById("updateClientSelect").value;
    const date = document.getElementById("updateDate").value;
    const notes = document.getElementById("updateNotes").value;

    let mediaUrl = null;

    try {
        if (selectedMediaFile) {
            const fileName = `${Date.now()}_${selectedMediaFile.name}`;
            const { error: uploadError } = await db.storage
                .from("updates_media")
                .upload(fileName, selectedMediaFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = db.storage
                .from("updates_media")
                .getPublicUrl(fileName);

            mediaUrl = publicUrlData.publicUrl;
        }

        const { error: insertError } = await db
            .from("daily_updates")
            .insert([
                {
                    client_id: clientId,
                    update_date: date,
                    notes: notes,
                    media_url: mediaUrl
                }
            ]);

        if (insertError) throw insertError;

        alert("تمت إضافة التحديث اليومي بنجاح!");
        closeUpdateModal();
        fetchDailyUpdates();

    } catch (err) {
        alert("حدث خطأ أثناء حفظ التحديث: " + err.message);
    }
}

async function fetchDailyUpdates() {
    const timeline = document.getElementById("globalTimeline");
    if (!timeline) return;

    try {
        const { data: updates, error } = await db
            .from("daily_updates")
            .select("*");

        if (error) throw error;

        timeline.innerHTML = "";

        if (!updates || updates.length === 0) {
            timeline.innerHTML = `<li>لا توجد تحديثات يومية حتى الآن.</li>`;
            return;
        }

        updates.forEach(item => {
            const li = document.createElement("li");
            li.className = "timeline-item";

            let mediaHTML = "";
            if (item.media_url) {
                const isVideo = item.media_url.endsWith(".mp4") || item.media_url.endsWith(".mov") || item.media_url.endsWith(".webm");
                if (isVideo) {
                    mediaHTML = `<video src="${item.media_url}" controls style="max-width: 100%; max-height: 200px; margin-top: 8px; border-radius: 8px;"></video>`;
                } else {
                    mediaHTML = `<img src="${item.media_url}" alt="تحديث" style="max-width: 100%; max-height: 200px; margin-top: 8px; border-radius: 8px;">`;
                }
            }

            li.innerHTML = `
                <div class="timeline-date">📌 ${item.update_date || ''}</div>
                <div class="timeline-content">
                    <p>${item.notes || ''}</p>
                    ${mediaHTML}
                </div>
            `;
            timeline.appendChild(li);
        });

    } catch (err) {
        console.error("خطأ في جلب التحديثات اليومية:", err.message);
    }
}


























// دالة جلب كافة التقارير للفيو الرئيسي
async function loadAllReports() {
    const tbody = document.getElementById("allReportsTbody");
    if (!tbody) return;

    try {
        // جلب التقارير مع اسم العميل
        const { data: reports, error } = await db
            .from("reports")
            .select(`
                id,
                title,
                pdf_url,
                created_at,
                clients ( name, apt_number )
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!reports || reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">لا توجد تقارير PDF مرفوعة حتى الآن.</td></tr>`;
            return;
        }

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${r.clients?.name || 'غير محدد'}</strong> (${r.clients?.apt_number || '-'})</td>
                <td>${r.title}</td>
                <td>${new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                    <a href="${r.pdf_url}" target="_blank" class="btn btn-sm btn-success">👁️ فتح / عرض PDF</a>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteReport('${r.id}')">🗑️ حذف</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">خطأ: ${err.message}</td></tr>`;
    }
}

// دالة حذف التقرير
async function deleteReport(reportId) {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;

    try {
        const { error } = await db.from("reports").delete().eq("id", reportId);
        if (error) throw error;
        alert("تم حذف التقرير بنجاح!");
        loadAllReports();
    } catch (err) {
        alert("فشل الحذف: " + err.message);
    }
}

// تشغيل الدالة تلقائياً عند فتح الصفحة
document.addEventListener("DOMContentLoaded", loadAllReports);






// 1. فتح نافذة رفع التقرير وتعبئة قائمة العملاء
async function loadClientsForSelect() {
    const clientSelect = document.getElementById("reportClientSelect");
    if (clientSelect) {
        clientSelect.innerHTML = '<option value="">-- اختر العميل --</option>';
        const { data: clients } = await db.from("clients").select("id, name, apt_number");
        if (clients) {
            clients.forEach(c => {
                clientSelect.innerHTML += `<option value="${c.id}">${c.name} (شقة: ${c.apt_number || '-'})</option>`;
            });
        }
    }
}

// 1. معالجة حفظ ورفع ملف الـ PDF مع حفظ اسم الشخص
document.getElementById("uploadReportForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const uploadedBy = document.getElementById("reportUploaderSelect").value;
    const title = document.getElementById("reportTitle").value;
    const fileInput = document.getElementById("reportPdfFile");
    const file = fileInput.files[0];

    if (!uploadedBy || !title || !file) return alert("يرجى اختيار اسمك وكتابة العنوان وتحديد الملف!");

    try {
        // إنشاء اسم ملف آمن
        const fileExt = file.name.split('.').pop();
        const safeFileName = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        // الرفع لـ Storage
        const { error: storageErr } = await db.storage.from("reports").upload(safeFileName, file);
        if (storageErr) throw storageErr;

        // جلب الرابط العام
        const { data: publicUrlData } = db.storage.from("reports").getPublicUrl(safeFileName);

        // حفظ البيانات مع اسم المسئول (uploaded_by)
        const { error: dbErr } = await db.from("reports").insert([{ 
            title: title, 
            uploaded_by: uploadedBy,
            pdf_url: publicUrlData.publicUrl 
        }]);

        if (dbErr) throw dbErr;

        alert(`تم رفع التقرير بنجاح بواسطة (${uploadedBy})!`);
        location.reload();
    } catch (err) {
        alert("حدث خطأ أثناء الرفع: " + err.message);
    }
});

// 2. جلب وتصميم جدول التقارير وعرض اسم المحرّر
async function loadAllReports() {
    const tbody = document.getElementById("allReportsTbody");
    if (!tbody) return; 

    try {
        const { data: reports, error } = await db
            .from("reports")
            .select("id, title, uploaded_by, pdf_url, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!reports || reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">لا توجد تقارير PDF مرفوعة حتى الآن.</td></tr>`;
            return;
        }

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${r.title}</strong></td>
                <td><span class="badge bg-info text-dark">${r.uploaded_by || 'غير محدد'}</span></td>
                <td>${new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                    <a href="${r.pdf_url}" target="_blank" class="btn btn-sm btn-success">👁️ عرض PDF</a>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteReport('${r.id}')">🗑️ حذف</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">خطأ: ${err.message}</td></tr>`;
    }
}

// دالة حذف التقرير
async function deleteReport(reportId) {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;
    try {
        const { error } = await db.from("reports").delete().eq("id", reportId);
        if (error) throw error;
        alert("تم الحذف بنجاح!");
        loadAllReports();
    } catch (err) {
        alert("فشل الحذف: " + err.message);
    }
}

// تشغيل جلب التقارير تلقائياً
document.addEventListener("DOMContentLoaded", loadAllReports);