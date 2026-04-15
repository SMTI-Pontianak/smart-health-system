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
        pageTitle.textContent = 'Medical History Form';
    });

    navView.addEventListener('click', (e) => {
        e.preventDefault();
        navView.classList.add('active');
        navAdd.classList.remove('active');
        formSection.style.display = 'none';
        viewSection.style.display = 'block';
        pageTitle.textContent = 'Saved Records';
        loadRecords();
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
                remarks TEXT
            );
        `);
        console.log("Database initialized.");
    } catch(err) {
        console.error("Failed to load SQL.js", err);
        alert("Failed to initialize database.");
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
        if(!db) return alert("Database is not ready!");

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
            document.getElementById('remarks').value || ''
        ];

        try {
            db.run(`INSERT INTO medical_history (
                name, placeOfBirth, dateOfBirth, age, gender, allergies, injuries, seizures, transfusions,
                congenital, otherSymptoms, vaccinations, famTb, famDiabetes, famHep, famAsthma,
                height, weight, bp, hr, temp, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, values);
            saveDatabase();
            alert("Record successfully saved to SQL database!");
            form.reset();
        } catch(err) {
            console.error(err);
            alert("Error saving record: " + err.message);
        }
    });

    // 4. View Records Table
    const loadRecords = () => {
        const tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';
        if(!db) return;

        const res = db.exec("SELECT id, name, age, gender, bp FROM medical_history");
        if(res.length > 0) {
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
        if (!window.jspdf) return alert('PDF Engine loading...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Check if form has at least a name
        const name = document.getElementById('name').value;
        if(!name) return alert("Please fill the Name field before exporting.");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("SMK-SMTI Pontianak", 105, 20, null, null, "center");
        doc.setFontSize(14);
        doc.text("Student Medical History Report", 105, 30, null, null, "center");

        const data = [
            ["Personal Information", ""],
            ["Name", name],
            ["Place & Date of Birth", `${document.getElementById('placeOfBirth').value}, ${document.getElementById('dateOfBirth').value}`],
            ["Age", document.getElementById('age').value],
            ["Gender", document.getElementById('gender').value],
            
            ["Medical History", ""],
            ["Allergies", document.getElementById('allergies').value || "None"],
            ["Severe Injuries", document.getElementById('injuries').value || "None"],
            ["Past Seizures", document.getElementById('seizures').value],
            ["Blood Transfusions", document.getElementById('transfusions').value],
            ["Congenital Diseases", document.getElementById('congenital').value || "None"],
            ["Other Symptoms", document.getElementById('otherSymptoms').value || "None"],
            ["Vaccinations", document.getElementById('vaccinations').value || "None"],

            ["Family History", ""],
            ["Tuberculosis (TB)", document.getElementById('famTb').value],
            ["Diabetes", document.getElementById('famDiabetes').value],
            ["Hepatitis", document.getElementById('famHep').value],
            ["Asthma", document.getElementById('famAsthma').value],

            ["Physical Checkup & Vitals", ""],
            ["Height / Weight", `${document.getElementById('height').value} cm / ${document.getElementById('weight').value} kg`],
            ["Blood Pressure", document.getElementById('bp').value],
            ["Heart Rate", `${document.getElementById('hr').value} bpm`],
            ["Body Temp", `${document.getElementById('temp').value} °C`],

            ["Remarks", document.getElementById('remarks').value || "None"]
        ];

        doc.autoTable({
            startY: 40,
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            didParseCell: function(data) {
                if(data.row.raw[1] === "") {
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
        if(stmt.step()) {
            const row = stmt.getAsObject();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("SMK-SMTI Pontianak", 105, 20, null, null, "center");
            doc.setFontSize(14);
            doc.text("Student Medical History Report", 105, 30, null, null, "center");

            const data = [
                ["Personal Information", ""],
                ["Name", row.name],
                ["Place & Date of Birth", `${row.placeOfBirth}, ${row.dateOfBirth}`],
                ["Age", row.age.toString()],
                ["Gender", row.gender],
                
                ["Medical History", ""],
                ["Allergies", row.allergies || "None"],
                ["Severe Injuries", row.injuries || "None"],
                ["Past Seizures", row.seizures],
                ["Blood Transfusions", row.transfusions],
                ["Congenital Diseases", row.congenital || "None"],
                ["Other Symptoms", row.otherSymptoms || "None"],
                ["Vaccinations", row.vaccinations || "None"],

                ["Family History", ""],
                ["Tuberculosis (TB)", row.famTb],
                ["Diabetes", row.famDiabetes],
                ["Hepatitis", row.famHep],
                ["Asthma", row.famAsthma],

                ["Physical Checkup & Vitals", ""],
                ["Height / Weight", `${row.height} cm / ${row.weight} kg`],
                ["Blood Pressure", row.bp],
                ["Heart Rate", `${row.hr} bpm`],
                ["Body Temp", `${row.temp} °C`],

                ["Remarks", row.remarks || "None"]
            ];

            doc.autoTable({
                startY: 40,
                body: data,
                theme: 'grid',
                didParseCell: function(data) {
                    if(data.row.raw[1] === "") {
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
        if(confirm("Are you sure you want to delete all database records? This cannot be undone.")) {
            localStorage.removeItem('sqliteDb');
            location.reload();
        }
    });

});
