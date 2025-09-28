// ===============================
// 🔥 INICIALIZAR FIREBASE
// ===============================
const auth = firebase.auth();
const db = firebase.firestore();

// ===============================
// 🔒 VERIFICAR SI HAY USUARIO LOGUEADO
// ===============================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// ===============================
// 🚪 BOTÓN DE CERRAR SESIÓN
// ===============================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
    try {
      await auth.signOut();
      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      mostrarError("❌ Hubo un problema al cerrar sesión");
    }
  });
}

// ===============================
// 📋 FORMULARIO: AGREGAR O EDITAR REGISTRO
// ===============================
const registroForm = document.getElementById("registroForm");
let editandoId = null; // Guarda el id cuando estamos editando

registroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tramite = document.getElementById("tramite").value;
  const cliente = document.getElementById("cliente").value;
  const direccion = document.getElementById("direccion").value;
  const metros = document.getElementById("metros").value;
  const fecha = document.getElementById("fecha").value;
  const empleado = document.getElementById("empleado").value;
  const hora = document.getElementById("hora").value;
  const horaFin = document.getElementById("horaFin").value;
  const observaciones = document.getElementById("observaciones").value;

  const fechaObj = new Date(fecha);

  try {
    if (editandoId) {
      // Actualizar registro existente
      await db.collection("registros").doc(editandoId).update({
        tramite,
        cliente,
        direccion,
        metros,
        fecha,
        empleado,
        hora,
        horaFin,
        observaciones
      });
      mostrarMensaje("✅ Registro actualizado");
      editandoId = null;
    } else {
      // Agregar nuevo registro
      await db.collection("registros").add({
        tramite,
        cliente,
        direccion,
        metros,
        fecha,
        empleado,
        hora,
        horaFin,
        observaciones,
        timestamp: new Date(),
        año: fechaObj.getFullYear(),
        mes: fechaObj.getMonth() + 1
      });
      mostrarMensaje("✅ Registro agregado con éxito");
    }

    registroForm.reset();
  } catch (error) {
    console.error(error);
    mostrarError("❌ Error al guardar registro");
  }
});

// ===============================
// 📄 MOSTRAR REGISTROS EN TABLA
// ===============================
const tabla = document.getElementById("tablaRegistros").getElementsByTagName("tbody")[0];

function mostrarRegistros() {
  db.collection("registros").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    tabla.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = tabla.insertRow();
      row.innerHTML = `
        <td>${data.tramite}</td>
        <td>${data.cliente}</td>
        <td>${data.direccion}</td>
        <td>${data.metros}</td>
        <td>${data.fecha}</td>
        <td>${data.hora}</td>
        <td>${data.horaFin}</td>
        <td>${data.empleado}</td>
        <td>${data.observaciones || ""}</td>
        <td><button class="editarBtn">✏️ Editar</button></td>
      `;

      // Botón de editar
      row.querySelector(".editarBtn").addEventListener("click", () => {
        editandoId = doc.id;

        // Llenar el formulario con los datos existentes
        document.getElementById("tramite").value = data.tramite;
        document.getElementById("cliente").value = data.cliente;
        document.getElementById("direccion").value = data.direccion;
        document.getElementById("metros").value = data.metros;
        document.getElementById("fecha").value = data.fecha;
        document.getElementById("empleado").value = data.empleado;
        document.getElementById("hora").value = data.hora;
        document.getElementById("horaFin").value = data.horaFin;
        document.getElementById("observaciones").value = data.observaciones || "";

        mostrarMensaje("✏️ Editando registro, al enviar se actualizará");
      });
    });
  });
}
mostrarRegistros();

// ===============================
// 🔍 BUSCAR EN TABLA
// ===============================
const searchInput = document.getElementById("search");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = tabla.getElementsByTagName("tr");
    Array.from(rows).forEach(row => {
      const cells = row.getElementsByTagName("td");
      const match = Array.from(cells).some(cell =>
        cell.textContent.toLowerCase().includes(filter)
      );
      row.style.display = match ? "" : "none";
    });
  });
}

// ===============================
// 📄 EXPORTAR PDF (MES ACTUAL)
// ===============================
const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("📋 Reporte de Instalaciones (Mes Actual)", 10, 10);

    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();

    const snapshot = await db.collection("registros")
      .where("mes", "==", mesActual)
      .where("año", "==", añoActual)
      .get();

    const rows = [];
    snapshot.forEach(docu => {
      const data = docu.data();
      rows.push([
        data.tramite,
        data.cliente,
        data.direccion,
        data.metros,
        data.fecha,
        data.hora,
        data.horaFin,
        data.empleado,
        data.observaciones || ""
      ]);
    });

    doc.autoTable({
      head: [["Trámite", "Cliente", "Dirección", "Metros", "Fecha", "Hora Inicio", "Hora Fin", "Empleado", "Observaciones"]],
      body: rows,
    });

    doc.save("reporte_mes.pdf");
  });
}

// ===============================
// 📢 FUNCIONES DE MENSAJES
// ===============================
function mostrarMensaje(texto) {
  let div = document.getElementById("mensajeInfo");
  if (!div) {
    div = document.createElement("div");
    div.id = "mensajeInfo";
    div.style.color = "green";
    div.style.fontWeight = "bold";
    document.body.prepend(div);
  }
  div.innerText = texto;
}

function mostrarError(texto) {
  let div = document.getElementById("mensajeError");
  if (!div) {
    div = document.createElement("div");
    div.id = "mensajeError";
    div.style.color = "red";
    div.style.fontWeight = "bold";
    document.body.prepend(div);
  }
  div.innerText = texto;
}

   

