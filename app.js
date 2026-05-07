document.addEventListener('DOMContentLoaded', async () => {
    // 1. Navigation Logic
    const navAdd = document.getElementById('nav-add');
    const navView = document.getElementById('nav-view');
    const formSection = document.getElementById('form-section');
    const viewSection = document.getElementById('view-section');
    const pageTitle = document.getElementById('page-title');

    navAdd.addEventListener('click', (e) => {
        e.preventDefault();
        navAdd.classList.add('active');
        navView.classList.remove('active');
        formSection.style.display = 'block';
        viewSection.style.display = 'none';
        pageTitle.textContent = 'Formulir Riwayat Medis';
    });

    navView.addEventListener('click', (e) => {
        e.preventDefault();
        navView.classList.add('active');
        navAdd.classList.remove('active');
        formSection.style.display = 'none';
        viewSection.style.display = 'block';
        pageTitle.textContent = 'Catatan Tersimpan';
        loadRecords();
    });

    // 1b. BPJS toggle
    const hasBpjsSelect = document.getElementById('hasBpjs');
    const bpjsGroup = document.getElementById('bpjs-group');
    hasBpjsSelect.addEventListener('change', () => {
        bpjsGroup.style.display = hasBpjsSelect.value === 'Yes' ? 'block' : 'none';
        if (hasBpjsSelect.value === 'No') document.getElementById('nomorBpjs').value = '';
    });

    // 2. Initialize SQL.js Database
    let db;
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const savedData = localStorage.getItem('sqliteDb');
        if (savedData) {
            // Load existing
            const uInt8Array = new Uint8Array(savedData.split(',').map(Number));
            db = new SQL.Database(uInt8Array);
        } else {
            // Create new
            db = new SQL.Database();
        }

        // Ensure table exists
        db.run(`
            CREATE TABLE IF NOT EXISTS medical_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                placeOfBirth TEXT,
                dateOfBirth TEXT,
                age INTEGER,
                gender TEXT,
                allergies TEXT,
                injuries TEXT,
                seizures TEXT,
                transfusions TEXT,
                congenital TEXT,
                otherSymptoms TEXT,
                vaccinations TEXT,
                famTb TEXT,
                famDiabetes TEXT,
                famHep TEXT,
                famAsthma TEXT,
                height REAL,
                weight REAL,
                bp TEXT,
                hr INTEGER,
                temp REAL,
                remarks TEXT,
                kelas TEXT,
                nomorBpjs TEXT
            );
        `);
        console.log("Database diinisialisasi.");
    } catch (err) {
        console.error("Gagal memuat SQL.js", err);
        alert("Gagal menginisialisasi database.");
    }

    // Utility: Save DB to LocalStorage
    const saveDatabase = () => {
        const data = db.export();
        const arrayStr = Array.from(data).join(',');
        localStorage.setItem('sqliteDb', arrayStr);
    };

    // 3. Form Submission
    const form = document.getElementById('health-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!db) return alert("Database belum siap!");

        const values = [
            document.getElementById('name').value,
            document.getElementById('placeOfBirth').value,
            document.getElementById('dateOfBirth').value,
            document.getElementById('age').value,
            document.getElementById('gender').value,
            document.getElementById('allergies').value || '',
            document.getElementById('injuries').value || '',
            document.getElementById('seizures').value,
            document.getElementById('transfusions').value,
            document.getElementById('congenital').value || '',
            document.getElementById('otherSymptoms').value || '',
            document.getElementById('vaccinations').value || '',
            document.getElementById('famTb').value,
            document.getElementById('famDiabetes').value,
            document.getElementById('famHep').value,
            document.getElementById('famAsthma').value,
            document.getElementById('height').value,
            document.getElementById('weight').value,
            document.getElementById('bp').value,
            document.getElementById('hr').value,
            document.getElementById('temp').value,
            document.getElementById('remarks').value || '',
            document.getElementById('kelas').value,
            document.getElementById('hasBpjs').value === 'Yes' ? document.getElementById('nomorBpjs').value : ''
        ];

        try {
            db.run(`INSERT INTO medical_history (
                name, placeOfBirth, dateOfBirth, age, gender, allergies, injuries, seizures, transfusions,
                congenital, otherSymptoms, vaccinations, famTb, famDiabetes, famHep, famAsthma,
                height, weight, bp, hr, temp, remarks, kelas, nomorBpjs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, values);
            saveDatabase();
            alert("Catatan berhasil disimpan ke database SQL!");
            form.reset();
        } catch (err) {
            console.error(err);
            alert("Kesalahan menyimpan catatan: " + err.message);
        }
    });

    // 4. View Records Table
    const loadRecords = () => {
        const tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';
        if (!db) return;

        const res = db.exec("SELECT id, name, age, gender, bp FROM medical_history");
        if (res.length > 0) {
            res[0].values.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>${row[2]}</td>
                    <td>${row[3]}</td>
                    <td>${row[4]}</td>
                    <td>
                        <button class="btn-small" onclick="window.exportSinglePdf(${row[0]})">PDF</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    };

    // 5. PDF Generation (Form values)
    document.getElementById('btn-pdf').addEventListener('click', () => {
        if (!window.jspdf) return alert('Memuat mesin PDF...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Check if form has at least a name
        const name = document.getElementById('name').value;
        if (!name) return alert("Silakan isi kolom Nama sebelum mengekspor.");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("SMK-SMTI Pontianak", 105, 20, null, null, "center");
        doc.setFontSize(14);
        doc.text("Laporan Riwayat Medis Siswa", 105, 30, null, null, "center");

        const data = [
            ["Informasi Pribadi", ""],
            ["Nama", name],
            ["Tempat & Tanggal Lahir", `${document.getElementById('placeOfBirth').value}, ${document.getElementById('dateOfBirth').value}`],
            ["Umur", document.getElementById('age').value],
            ["Jenis Kelamin", document.getElementById('gender').value],
            ["Kelas", document.getElementById('kelas').value],
            ["Nomor BPJS", document.getElementById('hasBpjs').value === 'Yes' ? (document.getElementById('nomorBpjs').value || 'Tidak diisi') : 'Tidak ada'],

            ["Riwayat Medis", ""],
            ["Alergi", document.getElementById('allergies').value || "Tidak ada"],
            ["Cedera Parah Sebelumnya", document.getElementById('injuries').value || "Tidak ada"],
            ["Riwayat Kejang", document.getElementById('seizures').value],
            ["Riwayat Transfusi Darah", document.getElementById('transfusions').value],
            ["Penyakit Bawaan", document.getElementById('congenital').value || "Tidak ada"],
            ["Gejala Lainnya", document.getElementById('otherSymptoms').value || "Tidak ada"],
            ["Riwayat Vaksinasi", document.getElementById('vaccinations').value || "Tidak ada"],

            ["Riwayat Keluarga", ""],
            ["Tuberkulosis (TBC)", document.getElementById('famTb').value],
            ["Diabetes", document.getElementById('famDiabetes').value],
            ["Hepatitis", document.getElementById('famHep').value],
            ["Asma", document.getElementById('famAsthma').value],

            ["Pemeriksaan Fisik & Tanda Vital", ""],
            ["Tinggi / Berat Badan", `${document.getElementById('height').value} cm / ${document.getElementById('weight').value} kg`],
            ["Tekanan Darah", document.getElementById('bp').value],
            ["Denyut Jantung", `${document.getElementById('hr').value} bpm`],
            ["Suhu Tubuh", `${document.getElementById('temp').value} °C`],

            ["Catatan Tambahan", document.getElementById('remarks').value || "Tidak ada"]
        ];

        doc.autoTable({
            startY: 40,
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            didParseCell: function (data) {
                if (data.row.raw[1] === "") {
                    data.cell.styles.fillColor = [220, 220, 220];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`${name.replace(/\s+/g, '_')}_Medical_History.pdf`);
    });

    // Handle PDF export from stored table
    window.exportSinglePdf = (id) => {
        const stmt = db.prepare("SELECT * FROM medical_history WHERE id = ?");
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("SMK-SMTI Pontianak", 105, 20, null, null, "center");
            doc.setFontSize(14);
            doc.text("Laporan Riwayat Medis Siswa", 105, 30, null, null, "center");

            const data = [
                ["Informasi Pribadi", ""],
                ["Nama", row.name],
                ["Tempat & Tanggal Lahir", `${row.placeOfBirth}, ${row.dateOfBirth}`],
                ["Umur", row.age.toString()],
                ["Jenis Kelamin", row.gender],
                ["Kelas", row.kelas || '-'],
                ["Nomor BPJS", row.nomorBpjs || 'Tidak ada'],

                ["Riwayat Medis", ""],
                ["Alergi", row.allergies || "Tidak ada"],
                ["Cedera Parah Sebelumnya", row.injuries || "Tidak ada"],
                ["Riwayat Kejang", row.seizures],
                ["Riwayat Transfusi Darah", row.transfusions],
                ["Penyakit Bawaan", row.congenital || "Tidak ada"],
                ["Gejala Lainnya", row.otherSymptoms || "Tidak ada"],
                ["Riwayat Vaksinasi", row.vaccinations || "Tidak ada"],

                ["Riwayat Keluarga", ""],
                ["Tuberkulosis (TBC)", row.famTb],
                ["Diabetes", row.famDiabetes],
                ["Hepatitis", row.famHep],
                ["Asma", row.famAsthma],

                ["Pemeriksaan Fisik & Tanda Vital", ""],
                ["Tinggi / Berat Badan", `${row.height} cm / ${row.weight} kg`],
                ["Tekanan Darah", row.bp],
                ["Denyut Jantung", `${row.hr} bpm`],
                ["Suhu Tubuh", `${row.temp} °C`],

                ["Catatan Tambahan", row.remarks || "Tidak ada"]
            ];

            doc.autoTable({
                startY: 40,
                body: data,
                theme: 'grid',
                didParseCell: function (data) {
                    if (data.row.raw[1] === "") {
                        data.cell.styles.fillColor = [220, 220, 220];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            doc.save(`${row.name.replace(/\s+/g, '_')}_Medical_History.pdf`);
        }
        stmt.free();
    };

    // 6. DB Reset
    document.getElementById('btn-reset-db').addEventListener('click', () => {
        if (confirm("Apakah Anda yakin ingin menghapus semua catatan database? Tindakan ini tidak dapat dibatalkan.")) {
            localStorage.removeItem('sqliteDb');
            location.reload();
        }
    });

});
