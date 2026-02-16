// --- LÓGICA DE REQUISITOS DINÁMICOS ---
function actualizarRequisitos() {
    const tipo = document.getElementById('tipoTramite').value;
    const l1 = document.getElementById('labelReq1');
    const l2 = document.getElementById('labelReq2');
    const l3 = document.getElementById('labelReq3');

    if (tipo === "Certificado de Beca") {
        l1.textContent = "Solicitud escrita del estudiante";
        l2.textContent = "Fotocopia de cédula de identidad";
        l3.textContent = "Historial académico actualizado";
    } else if (tipo === "Certificado de Estudios") {
        l1.textContent = "Fotocopia de cédula de identidad";
        l2.textContent = "Formulario de solicitud institucional";
        l3.textContent = "Comprobante de matrícula vigente";
    } else if (tipo === "Legalización") {
        l1.textContent = "Documento original a legalizar";
        l2.textContent = "Fotocopia de cédula de identidad";
        l3.textContent = "Comprobante de pago correspondiente";
    }
}

// --- MODALES ---
function cerrar(id) { document.getElementById(id).style.display = 'none'; }

document.getElementById('btnConsultar').onclick = () => document.getElementById('modalConsulta').style.display = 'block';

document.getElementById('btnOpenLogin').onclick = () => {
    document.getElementById('loginEmail').value = "";
    document.getElementById('loginPass').value = "";
    document.getElementById('modalLogin').style.display = 'block';
};

document.getElementById('btnIniciar').onclick = () => {
    document.getElementById('modalTramite').style.display = 'block';
    document.getElementById('idAutomatico').value = "ALC-" + Math.floor(1000 + Math.random() * 9000);
    actualizarRequisitos();
};

// --- REGISTRO DE TRÁMITE ---
async function registrarTramite() {
    const nom = document.getElementById('nomSol').value.trim();
    const ape = document.getElementById('apeSol').value.trim();
    const tipo = document.getElementById('tipoTramite').value;
    const id = document.getElementById('idAutomatico').value;

    if (!nom || !ape) return alert("Completa nombre y apellido");

    const leerArchivo = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    let archivosData = [];
    for (let i = 1; i <= 3; i++) {
        const fileInput = document.getElementById('file' + i);
        if (fileInput.files.length === 0) return alert("Falta un requisito");
        const dataUrl = await leerArchivo(fileInput.files[0]);
        archivosData.push({ nombre: fileInput.files[0].name, contenido: dataUrl });
    }

    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString() + " " + ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const nuevo = { id, nombre: nom, apellido: ape, tipo, estado: "espera", fecha: fechaStr, archivos: archivosData };
    
    let db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    db.push(nuevo);
    localStorage.setItem('tramitesAlcaldia', JSON.stringify(db));

    alert("Trámite enviado con éxito.");
    cerrar('modalTramite');
}

// --- PANEL ADMIN ---
function validarAcceso() {
    if (document.getElementById('loginEmail').value === "carmen.condori@alcaldia.gob" && 
        document.getElementById('loginPass').value === "Admin123") {
        cerrar('modalLogin');
        document.getElementById('mainView').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        cargarPanelAdmin();
    } else { alert("Acceso denegado."); }
}

function cargarPanelAdmin() {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    const lista = document.getElementById('listaTramitesAdmin');
    if (!lista) return;
    lista.innerHTML = "";
    if (db.length === 0) {
        lista.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No hay trámites registrados.</td></tr>`;
        return;
    }
    renderizarTabla(db);
}

function renderizarTabla(datos) {
    const lista = document.getElementById('listaTramitesAdmin');
    const dbOriginal = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    lista.innerHTML = "";

    datos.forEach((t) => {
        const indexReal = dbOriginal.findIndex(item => item.id === t.id);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${t.fecha}</td>
            <td>${t.nombre} ${t.apellido}</td>
            <td>${t.tipo}</td>
            <td><span class="status-${t.estado}">${t.estado.toUpperCase()}</span></td>
            <td>
                <button class="btn-acc btn-check" onclick="cambiarEstado(${indexReal}, 'aceptado')">✓</button>
                <button class="btn-acc btn-x" onclick="cambiarEstado(${indexReal}, 'rechazado')">✕</button>
                <button class="btn-acc btn-doc" style="background:#f39c12;" onclick="verArchivosUsuario(${indexReal})">📂 Ver Archivos</button>
                <button class="btn-acc btn-doc" onclick="abrirMandarDoc(${indexReal})">✉ Enviar Doc</button>
            </td>
        `;
        lista.appendChild(fila);
    });
}

// --- BUSCADOR REAL ---
// BUSCADOR MEJORADO
function filtrarPorNombre() {
    const texto = document.getElementById('buscadorAdmin').value.toLowerCase();
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    
    // Filtra comparando con nombre y apellido
    const filtrados = db.filter(t => {
        const nombreCompleto = (t.nombre + " " + t.apellido).toLowerCase();
        return nombreCompleto.includes(texto);
    });

    renderizarTabla(filtrados);
}

// EXPORTAR EXCEL REAL
function descargarExcel() {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    if (db.length === 0) return alert("No hay datos para exportar.");

    // \ufeff es el BOM para que Excel lea correctamente acentos y la Ñ
    let csv = "\ufeffID,Fecha,Solicitante,Trámite,Estado\n";
    db.forEach(t => {
        csv += `${t.id},${t.fecha},${t.nombre} ${t.apellido},${t.tipo},${t.estado.toUpperCase()}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Tramites_Alcaldia.csv";
    link.click();
}

// BORRADO DEFINITIVO
function borrarTodoReal() {
    if (confirm("⚠️ ¿Estás seguro? Se borrarán todos los trámites y archivos permanentemente.")) {
        localStorage.removeItem('tramitesAlcaldia'); // Elimina de la memoria
        cargarPanelAdmin(); // Limpia la tabla visualmente
        alert("Base de datos vaciada.");
    }
}
// --- OTRAS FUNCIONES ---
function verArchivosUsuario(index) {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    const t = db[index];
    const contenedor = document.getElementById('contenedorFotos');
    contenedor.innerHTML = "";

    t.archivos.forEach(file => {
        const div = document.createElement('div');
        div.style = "margin-bottom:20px; padding:10px; border-bottom:1px solid #ddd;";
        div.innerHTML = `<p style="font-weight:bold;">Archivo: ${file.nombre}</p>`;

        if (file.contenido.includes("image")) {
            div.innerHTML += `<img src="${file.contenido}" style="width:100%; border:1px solid #ccc;">`;
        } else {
            div.innerHTML += `<a href="${file.contenido}" download="${file.nombre}" style="color:#2563eb;">📄 Descargar Documento</a>`;
        }
        contenedor.appendChild(div);
    });
    document.getElementById('modalVerFotos').style.display = 'block';
}

function cambiarEstado(index, nuevo) {
    let db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    db[index].estado = nuevo;
    localStorage.setItem('tramitesAlcaldia', JSON.stringify(db));
    cargarPanelAdmin();
}

function buscarTramite() {
    const idBusca = document.getElementById('idBusqueda').value.trim();
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia')) || [];
    const t = db.find(item => item.id === idBusca);
    const res = document.getElementById('resultadoBusqueda');

    if (t) {
        res.innerHTML = `<div style="background:white; padding:10px; border:2px solid #1d3557; margin-top:10px;">
            <strong>ID:</strong> ${t.id}<br>
            <strong>Estado:</strong> ${t.estado.toUpperCase()}<br>
            <strong>Nombre:</strong> ${t.nombre} ${t.apellido}
        </div>`;
    } else {
        res.innerHTML = "<span style='color:red;'>Trámite no encontrado.</span>";
    }
}

let indiceActual = null;
function abrirMandarDoc(index) {
    const db = JSON.parse(localStorage.getItem('tramitesAlcaldia'));
    indiceActual = index;
    document.getElementById('infoDestino').textContent = "Enviar a: " + db[index].nombre + " " + db[index].apellido;
    document.getElementById('modalMandarDoc').style.display = 'block';
}

function confirmarEnvio() {
    const fileInput = document.getElementById('fileRespuesta');
    if(fileInput.files.length === 0) return alert("Seleccione un documento.");

    // Simulación de éxito sin salir del entorno local
    alert("✅ Documento procesado con éxito. Se ha enviado la notificación al usuario.");
    cerrar('modalMandarDoc');
}