document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();  

  // 🔒 Verificar usuario logueado
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
    }
  });

  //  Botón de cerrar sesión
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "index.html";
      } catch (err) {
        alert(err.message);
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
      // Mensaje bonito con SweetAlert2
      Swal.fire({
        icon: 'success',
        title: '✅ El Registro se actualizado',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        position: 'top-end',
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
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
      // Mensaje bonito con SweetAlert2
      Swal.fire({
        icon: 'success',
        title: '✅ Registro agregado con éxito',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        position: 'top-end',
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
    }

    registroForm.reset();
  } catch (error) {
    console.error(error);
    // Mensaje de error bonito con SweetAlert2
    Swal.fire({
      icon: 'error',
      title: '❌ Error al guardar registro',
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      position: 'top-end',
      customClass: {
        icon: 'swal2-icon-custom'
      }
    });
  }
});

// ===============================
// 📄 MOSTRAR REGISTROS EN TABLA (FILTRADO POR MES)
// ===============================
const tabla = document.getElementById("tablaRegistros").getElementsByTagName("tbody")[0];
let mesActual = new Date().getMonth() + 1; // Mes actual (1-12)
let añoActual = new Date().getFullYear(); // Año actual

function mostrarRegistros(mes = mesActual, año = añoActual) {
  db.collection("registros")
    .where("mes", "==", mes)
    .where("año", "==", año)
    .orderBy("fecha", "desc")
    .onSnapshot(snapshot => {
      tabla.innerHTML = "";
      
      if (snapshot.empty) {
        // Si no hay registros para este mes, mostrar mensaje
        tabla.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 20px; color: #666;">
              No hay registros para este mes
            </td>
          </tr>
        `;
        return;
      }
      
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
          <td>
            ${data.observaciones || ""}
             <div class="acciones-container">
               <button class="menuBtn">⋯</button>
             <div class="accionesOpciones hidden">
              <button class="editarBtn">✏️ Editar</button>
              <button class="borrarBtn">🗑️ Borrar</button>
             </div>
             </div>
          </td>
        `;

        const menuBtn = row.querySelector(".menuBtn");
        const accionesOpciones = row.querySelector(".accionesOpciones");

       // Mostrar/ocultar menú al hacer clic en los tres puntitos
         menuBtn.addEventListener("click", (e) => {
         e.stopPropagation(); // Para que no se cierre al instante
        accionesOpciones.classList.toggle("hidden");
        });

       // Cerrar menú si se hace clic fuera
       document.addEventListener("click", () => {
       accionesOpciones.classList.add("hidden");
      });

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

        });

        // Botón de borrar
        row.querySelector(".borrarBtn").addEventListener("click", () => {
          Swal.fire({
            icon: "warning",
            title: "¿Estás seguro?",
            text: "¿Querés borrar esta línea de la tabla?",
            showCancelButton: true,
            confirmButtonText: "Sí, borrar",
            cancelButtonText: "No",
            confirmButtonColor: "#667eea",
            cancelButtonColor: "#aaa",
            customClass: {
              icon: "swal2-icon-custom"
            }
          }).then(async (result) => {
            if (result.isConfirmed) {
              // Animación antes de eliminar
              row.classList.add("fila-oculta");

              setTimeout(async () => {
                try {
                  await db.collection("registros").doc(doc.id).delete();
                  row.remove();

                  Swal.fire({
                    icon: "success",
                    title: "¡Eliminado!",
                    text: "El registro fue eliminado correctamente.",
                    timer: 1800,
                    showConfirmButton: false,
                    customClass: {
                      icon: "swal2-icon-custom"
                    }
                  });
                } catch (error) {
                  console.error(error);
                  Swal.fire({
                    icon: "error",
                    title: "Error al eliminar",
                    text: "No se pudo eliminar el registro.",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#667eea",
                    customClass: {
                      icon: "swal2-icon-custom"
                    }
                  });
                }
              }, 400); // Tiempo de la animación
            }
          });
        });
      });
    });
}

// Función para cambiar el mes que se muestra en la tabla
function cambiarMesTabla(mes, año) {
  mesActual = mes;
  añoActual = año;
  mostrarRegistros(mes, año);
}

// Iniciar mostrando el mes actual
mostrarRegistros();

// ===============================
// 🔍 BUSCAR EN TABLA (BUSCA EN TODOS LOS MESES)
// ===============================
const searchInput = document.getElementById("search");
let listenerBusqueda = null; // Para guardar la suscripción

if (searchInput) {
  searchInput.addEventListener("input", async () => {
    const filter = searchInput.value.toLowerCase().trim();
    
    // Si está vacío, volver a mostrar el mes actual
    if (filter === "") {
      if (listenerBusqueda) {
        listenerBusqueda(); // Cancelar listener anterior
        listenerBusqueda = null;
      }
      mostrarRegistros(mesActual, añoActual);
      return;
    }
    
    // Cancelar listener anterior si existe
    if (listenerBusqueda) {
      listenerBusqueda();
      listenerBusqueda = null;
    }
    
    // Buscar en toda la base de datos del año
    const snapshot = await db.collection("registros")
      .where("año", "==", añoActual)
      .get();
    
    tabla.innerHTML = "";
    let encontrados = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const texto = `${data.tramite} ${data.cliente} ${data.direccion} ${data.metros} ${data.fecha} ${data.empleado} ${data.observaciones}`.toLowerCase();
      
      if (texto.includes(filter)) {
        encontrados++;
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
          <td>
            ${data.observaciones || ""}
            <div class="acciones-container">
              <button class="menuBtn">⋯</button>
              <div class="accionesOpciones hidden">
                <button class="editarBtn">✏️ Editar</button>
                <button class="borrarBtn">🗑️ Borrar</button>
              </div>
            </div>
          </td>
        `;

        // Eventos del menú
        const menuBtn = row.querySelector(".menuBtn");
        const accionesOpciones = row.querySelector(".accionesOpciones");
        menuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          accionesOpciones.classList.toggle("hidden");
        });

        // Botón editar
        row.querySelector(".editarBtn").addEventListener("click", () => {
          editandoId = doc.id;
          document.getElementById("tramite").value = data.tramite;
          document.getElementById("cliente").value = data.cliente;
          document.getElementById("direccion").value = data.direccion;
          document.getElementById("metros").value = data.metros;
          document.getElementById("fecha").value = data.fecha;
          document.getElementById("empleado").value = data.empleado;
          document.getElementById("hora").value = data.hora;
          document.getElementById("horaFin").value = data.horaFin;
          document.getElementById("observaciones").value = data.observaciones || "";
        });

        // Botón borrar
        row.querySelector(".borrarBtn").addEventListener("click", () => {
          Swal.fire({
            icon: "warning",
            title: "¿Estás seguro?",
            text: "¿Querés borrar esta línea de la tabla?",
            showCancelButton: true,
            confirmButtonText: "Sí, borrar",
            cancelButtonText: "No",
            confirmButtonColor: "#667eea",
            cancelButtonColor: "#aaa",
            customClass: { icon: "swal2-icon-custom" }
          }).then(async (result) => {
            if (result.isConfirmed) {
              row.classList.add("fila-oculta");
              setTimeout(async () => {
                await db.collection("registros").doc(doc.id).delete();
                row.remove();
                Swal.fire({
                  icon: "success",
                  title: "¡Eliminado!",
                  timer: 1800,
                  showConfirmButton: false,
                  customClass: { icon: "swal2-icon-custom" }
                });
              }, 400);
            }
          });
        });
      }
    });
    
    if (encontrados === 0) {
      tabla.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No se encontraron resultados</td></tr>`;
    }
  });
}

// ===============================
// 📄 EXPORTAR PDF (MES ACTUAL)
// ===============================
// Función para saber si hoy es el último día del mes
function esUltimoDiaDelMes(fecha = new Date()) {
  const siguienteDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
  return siguienteDia.getDate() === 1;
}

// Mostrar cartel si hoy es el último día del mes
if (esUltimoDiaDelMes()) {
  Swal.fire({
    icon: "success",
    title: "📅 ¡Último día del mes!",
    text: "Es importante descargar el PDF con los datos del mes antes de que finalice.",
    confirmButtonText: "Entendido",
    customClass: {
      icon: 'swal2-icon-custom swal2-success',
      confirmButton: 'swal2-confirm'
    }
  });
}

// Botón exportar PDF y menú desplegable
const exportBtn = document.getElementById("exportBtn");

// Crear menú desplegable para seleccionar mes
function crearMenuMeses() {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const menu = document.createElement("div");
  menu.style.position = "fixed";
  menu.style.backgroundColor = "white";
  menu.style.border = "1px solid #ccc";
  menu.style.padding = "5px";
  menu.style.display = "none";
  menu.style.zIndex = 1000;
  menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  menu.style.width = "250px"; // Aumenté el ancho para la flechita
  menu.style.maxHeight = "300px";
  menu.style.overflowY = "auto";
  menu.id = "menuMesesPdf";

  meses.forEach((mes, index) => {
    const item = document.createElement("div");
    item.style.padding = "8px 10px";
    item.style.cursor = "pointer";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    
    // Nombre del mes
    const nombreMes = document.createElement("span");
    nombreMes.textContent = mes;
    nombreMes.style.flex = "1";
    nombreMes.dataset.mes = index + 1;
    
    // Botón de descarga (flechita)
    const btnDescargar = document.createElement("button");
    btnDescargar.innerHTML = "📥";
    btnDescargar.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    btnDescargar.style.border = "none";
    btnDescargar.style.borderRadius = "5px";
    btnDescargar.style.padding = "5px 10px";
    btnDescargar.style.cursor = "pointer";
    btnDescargar.style.fontSize = "16px";
    btnDescargar.dataset.mes = index + 1;
    
    // Click en el nombre del mes - SOLO cambiar tabla
    nombreMes.addEventListener("click", (e) => {
      e.stopPropagation();
      const mesSeleccionado = Number(nombreMes.dataset.mes);
      cambiarMesTabla(mesSeleccionado, añoActual);
      // NO cerrar el menú para que puedan descargar si quieren
    });
    
    // Click en la flechita - descargar PDF
    btnDescargar.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = "none";
      const mesSeleccionado = Number(btnDescargar.dataset.mes);
      exportarPdfMes(mesSeleccionado);
    });

    // Hover en toda la fila
    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f0f0f0";
    });

    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "white";
    });

    item.appendChild(nombreMes);
    item.appendChild(btnDescargar);
    menu.appendChild(item);
  });

  document.body.appendChild(menu);
  return menu;
}

// Crear menú al inicio (una sola vez)
const menuMeses = crearMenuMeses();

// Posicionar y mostrar el menú debajo del botón
function toggleMenu() {
  if (menuMeses.style.display === "block") {
    menuMeses.style.display = "none";
  } else {
    const rect = exportBtn.getBoundingClientRect();
    const menuHeight = 300;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let top = rect.bottom + 5;
    if (top + menuHeight > viewportHeight) {
      top = rect.top - menuHeight - 5;
    }
    
    let left = rect.left;
    const menuWidth = 250;
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 10;
    }
    
    menuMeses.style.top = top + "px";
    menuMeses.style.left = left + "px";
    menuMeses.style.display = "block";
  }
}

// Función para exportar PDF de mes dado
async function exportarPdfMes(mes) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const añoActual = new Date().getFullYear();
  const nombreMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ][mes - 1];

  doc.text(`📋 Reporte de Instalaciones (${nombreMes} ${añoActual})`, 10, 10);

  const snapshot = await db.collection("registros")
    .where("mes", "==", Number(mes))
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

  if (rows.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sin datos",
      text: `No hay registros para ${nombreMes} ${añoActual}`,
      confirmButtonColor: "#667eea"
    });
    return;
  }

  doc.autoTable({
    head: [["Trámite", "Cliente", "Dirección", "Metros", "Fecha", "Hora Inicio", "Hora Fin", "Empleado", "Observaciones"]],
    body: rows,
  });

  doc.save(`reporte_${nombreMes.toLowerCase()}_${añoActual}.pdf`);
}

// Manejo click botón exportar
if (exportBtn) {
  exportBtn.style.position = "relative";

  const flecha = document.createElement("span");
  flecha.innerHTML = " ▼";
  flecha.style.cursor = "pointer";
  exportBtn.appendChild(flecha);

  exportBtn.addEventListener("click", (e) => {
    if (e.target === flecha) {
      toggleMenu();
    } else {
      // Exportar mes actual
      const mesActual = new Date().getMonth() + 1;
      exportarPdfMes(mesActual);
      menuMeses.style.display = "none";
    }
  });

  document.addEventListener("click", (e) => {
    if (!exportBtn.contains(e.target) && !menuMeses.contains(e.target)) {
      menuMeses.style.display = "none";
    }
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

});
