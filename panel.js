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

  // Parsear la fecha correctamente para evitar problemas de zona horaria
  const [anioFecha, mesFecha, diaFecha] = fecha.split('-').map(Number);
  const fechaObj = new Date(anioFecha, mesFecha - 1, diaFecha);

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
        observaciones,
        año: Number(anioFecha),
        mes: Number(mesFecha)
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
        año: Number(anioFecha),
        mes: Number(mesFecha)
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
let mesActual = new Date().getMonth() + 1;
let añoActual = new Date().getFullYear();

// Variable global para rastrear el menú abierto
let menuAbiertoActual = null;

// ===============================
// FUNCIONES REUTILIZABLES PARA MENÚ DE ACCIONES
// ===============================

function configurarMenuAcciones(row, menuBtn, accionesOpciones) {
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Si hay un menú abierto y no es este, cerrarlo
    if (menuAbiertoActual && menuAbiertoActual !== accionesOpciones) {
      menuAbiertoActual.classList.add("hidden");
    }
    
    // Toggle del menú actual
    accionesOpciones.classList.toggle("hidden");
    
    // Actualizar referencia del menú abierto
    if (!accionesOpciones.classList.contains("hidden")) {
      menuAbiertoActual = accionesOpciones;
    } else {
      menuAbiertoActual = null;
    }
  });
}

function configurarBotonEditar(boton, docId, data) {
  boton.addEventListener("click", () => {
    editandoId = docId;
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
}

function configurarBotonBorrar(boton, docId, row) {
  boton.addEventListener("click", () => {
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
        row.classList.add("fila-oculta");
        setTimeout(async () => {
          try {
            // PRIMERO: Obtener los datos antes de borrar
            const doc = await db.collection("registros").doc(docId).get();
            const data = doc.data();
            
            // SEGUNDO: Registrar la eliminación
            await registrarEliminacion(docId, data);
            
            // TERCERO: Borrar el documento
            await db.collection("registros").doc(docId).delete();
            
            row.remove();
            Swal.fire({
              icon: "success",
              title: "¡Eliminado!",
              text: "El registro fue eliminado y guardado en el historial.",
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
        }, 400);
      }
    });
  });
}

// ===============================
// FUNCIÓN PRINCIPAL: MOSTRAR REGISTROS
// ===============================

function mostrarRegistros(mes = mesActual, año = añoActual) {
  db.collection("registros")
    .where("mes", "==", mes)
    .where("año", "==", año)
    .orderBy("fecha", "desc")
    .onSnapshot(snapshot => {
      tabla.innerHTML = "";
      
      if (snapshot.empty) {
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
        <td data-label="Trámite">${data.tramite}</td>
        <td data-label="Cliente">${data.cliente}</td>
        <td data-label="Dirección">${data.direccion}</td>
        <td data-label="Metros">${data.metros}</td>
        <td data-label="Fecha">${data.fecha}</td>
        <td data-label="Hora Inicio">${data.hora}</td>
        <td data-label="Hora Fin">${data.horaFin}</td>
        <td data-label="Empleado">${data.empleado}</td>
        <td data-label="Observaciones">
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

        // Configurar eventos del menú usando las funciones reutilizables
        const menuBtn = row.querySelector(".menuBtn");
        const accionesOpciones = row.querySelector(".accionesOpciones");
        const editarBtn = row.querySelector(".editarBtn");
        const borrarBtn = row.querySelector(".borrarBtn");

        configurarMenuAcciones(row, menuBtn, accionesOpciones);
        configurarBotonEditar(editarBtn, doc.id, data);
        configurarBotonBorrar(borrarBtn, doc.id, row);
      });
    });
}

// Cerrar menú al hacer clic fuera (GLOBAL)
document.addEventListener("click", (e) => {
  if (menuAbiertoActual && !e.target.closest(".acciones-container")) {
    menuAbiertoActual.classList.add("hidden");
    menuAbiertoActual = null;
  }
});

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
let listenerBusqueda = null;

if (searchInput) {
  searchInput.addEventListener("input", async () => {
    const filter = searchInput.value.toLowerCase().trim();
    
    if (filter === "") {
      if (listenerBusqueda) {
        listenerBusqueda();
        listenerBusqueda = null;
      }
      mostrarRegistros(mesActual, añoActual);
      return;
    }
    
    if (listenerBusqueda) {
      listenerBusqueda();
      listenerBusqueda = null;
    }
    
    const snapshot = await db.collection("registros")
      .where("año", "==", añoActual)
      .get();
    
    tabla.innerHTML = "";
    let encontrados = 0;
    
    // Variables para detectar búsqueda por fecha + empleado
    let contadorPorEmpleado = {};
    let fechaBuscada = null;
    let empleadosBuscados = [];
    
    // Detectar si está buscando "aldo" o "angel" en el texto
    const buscaAldo = filter.includes("aldo");
    const buscaAngel = filter.includes("angel");
    
    if (buscaAldo) empleadosBuscados.push("aldo");
    if (buscaAngel) empleadosBuscados.push("angel");
    
    // Detectar si está buscando por fecha (formato dd/mm/yyyy o yyyy-mm-dd)
    const esFecha = /\d{1,2}\/\d{1,2}\/\d{4}/.test(filter) || /\d{4}-\d{1,2}-\d{1,2}/.test(filter);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const texto = `${data.tramite} ${data.cliente} ${data.direccion} ${data.metros} ${data.fecha} ${data.empleado} ${data.observaciones}`.toLowerCase();
      
      if (texto.includes(filter)) {
        encontrados++;
        
        // Si es búsqueda por fecha + empleado específico, contar solo ese empleado
        if (esFecha && data.empleado && empleadosBuscados.length > 0) {
          const empleado = data.empleado.toLowerCase().trim();
          
          // Solo contar si el empleado está en la lista de buscados
          if (empleadosBuscados.includes(empleado)) {
            if (!contadorPorEmpleado[empleado]) {
              contadorPorEmpleado[empleado] = 0;
            }
            contadorPorEmpleado[empleado]++;
            
            // Guardar la fecha formateada
            if (!fechaBuscada && data.fecha) {
              fechaBuscada = data.fecha;
            }
          }
        }
        
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

        // Configurar eventos del menú usando las funciones reutilizables
        const menuBtn = row.querySelector(".menuBtn");
        const accionesOpciones = row.querySelector(".accionesOpciones");
        const editarBtn = row.querySelector(".editarBtn");
        const borrarBtn = row.querySelector(".borrarBtn");

        configurarMenuAcciones(row, menuBtn, accionesOpciones);
        configurarBotonEditar(editarBtn, doc.id, data);
        configurarBotonBorrar(borrarBtn, doc.id, row);
      }
    });
    
    if (encontrados === 0) {
      tabla.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No se encontraron resultados</td></tr>`;
    } else if (esFecha && Object.keys(contadorPorEmpleado).length > 0) {
      // Mostrar mensaje con resultados por empleado
      let mensajes = [];
      for (const [empleado, cantidad] of Object.entries(contadorPorEmpleado)) {
        const nombreEmpleado = empleado.charAt(0).toUpperCase() + empleado.slice(1);
        mensajes.push(`${cantidad} instalación${cantidad !== 1 ? 'es' : ''} de ${nombreEmpleado}`);
      }
      
      Swal.fire({
        icon: 'info',
        title: '🔍 Resultados de búsqueda',
        html: `<strong>Fecha:</strong> ${fechaBuscada}<br><br>${mensajes.join('<br>')}`,
        confirmButtonColor: '#667eea',
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
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
  menu.style.width = "250px";
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
    item.style.transition = "background-color 0.2s ease";
    item.dataset.mesNumero = index + 1;
    item.classList.add("menu-mes-item");
    
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
    
    // Click en el nombre del mes - cambiar tabla Y actualizar mes activo
    nombreMes.addEventListener("click", (e) => {
      e.stopPropagation();
      const mesSeleccionado = Number(nombreMes.dataset.mes);
      cambiarMesTabla(mesSeleccionado, añoActual);
      actualizarMesActivo(mesSeleccionado); // Actualizar visualmente
    });
    
    // Click en la flechita - descargar PDF
    btnDescargar.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = "none";
      const mesSeleccionado = Number(btnDescargar.dataset.mes);
      exportarPdfMes(mesSeleccionado);
    });

    // Hover - SOLO si NO es el mes activo
    item.addEventListener("mouseenter", () => {
      const esActivo = item.classList.contains("mes-activo");
      if (!esActivo) {
        item.style.backgroundColor = "#f0f0f0";
      }
    });

    item.addEventListener("mouseleave", () => {
      const esActivo = item.classList.contains("mes-activo");
      if (!esActivo) {
        item.style.backgroundColor = "white";
      }
    });

    item.appendChild(nombreMes);
    item.appendChild(btnDescargar);
    menu.appendChild(item);
  });

  document.body.appendChild(menu);
  return menu;
}

// Función para actualizar el mes activo visualmente
function actualizarMesActivo(mes) {
  const menuItems = document.querySelectorAll("#menuMesesPdf > div");
  menuItems.forEach(item => {
    const mesNumero = Number(item.dataset.mesNumero);
    if (mesNumero === mes) {
      // Estilo para el mes activo
      item.classList.add("mes-activo");
      item.style.backgroundColor = "#667eea";
      item.style.color = "white";
      item.querySelector("span").style.fontWeight = "bold";
    } else {
      // Estilo normal
      item.classList.remove("mes-activo");
      item.style.backgroundColor = "white";
      item.style.color = "black";
      item.querySelector("span").style.fontWeight = "normal";
    }
  });
}

// Crear menú al inicio (una sola vez)
const menuMeses = crearMenuMeses();
actualizarMesActivo(mesActual); // Marcar el mes actual al inicio

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

// ===============================
// 💰 REPORTE DE FACTURACIÓN
// Configuración de rangos de precios

const RANGOS_PRECIOS = [
  { min: 0, max: 50, precio: 25000, label: "0-50" },
  { min: 50, max: 100, precio: 35000, label: "50-100" },
  { min: 100, max: 150, precio: 45000, label: "100-150" },
  { min: 150, max: 200, precio: 55000, label: "150-200" },
  { min: 200, max: 250, precio: 60000, label: "200-250" },
  { min: 250, max: 300, precio: 70000, label: "250-300" }
];

// Estado para mostrar/ocultar montos
let montosOcultos = false;

// Función para determinar el precio según los metros
function obtenerPrecioPorMetros(metros) {
  const metrosNum = Number(metros);
  
  for (const rango of RANGOS_PRECIOS) {
    if (metrosNum > rango.min && metrosNum <= rango.max) {
      return rango.precio;
    }
  }
  
  // Si los metros son mayores a 300, usar el último precio
  if (metrosNum > 300) {
    return RANGOS_PRECIOS[RANGOS_PRECIOS.length - 1].precio;
  }
  
  return 0;
}

// Función para formatear números como moneda
function formatearMoneda(numero) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(numero);
}

// Toggle para mostrar/ocultar montos
const toggleBtn = document.getElementById("toggleMontos");
const iconoOjo = document.getElementById("iconoOjo");
const textoToggle = document.getElementById("textoToggle");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    montosOcultos = !montosOcultos;
    
    // Cambiar icono y texto
    if (montosOcultos) {
      iconoOjo.textContent = "🙈";
      textoToggle.textContent = "Mostrar Montos";
    } else {
      iconoOjo.textContent = "👁️";
      textoToggle.textContent = "Ocultar Montos";
    }
    
    // Aplicar/quitar blur a todos los montos
    const todosLosMontos = document.querySelectorAll(".monto, .total-monto");
    todosLosMontos.forEach(monto => {
      if (montosOcultos) {
        monto.classList.remove("visible");
        monto.classList.add("oculto");
      } else {
        monto.classList.remove("oculto");
        monto.classList.add("visible");
      }
    });
  });
}

// Generar reporte
const btnGenerarReporte = document.getElementById("generarReporte");
const resultadosReporte = document.getElementById("resultadosReporte");

if (btnGenerarReporte) {
  btnGenerarReporte.addEventListener("click", async () => {
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;
    
    if (!fechaInicio || !fechaFin) {
      Swal.fire({
        icon: "warning",
        title: "Faltan datos",
        text: "Por favor seleccioná ambas fechas",
        confirmButtonColor: "#667eea",
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
      return;
    }
    
    if (fechaInicio > fechaFin) {
      Swal.fire({
        icon: "error",
        title: "Error en fechas",
        text: "La fecha de inicio no puede ser mayor a la fecha final",
        confirmButtonColor: "#667eea",
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
      return;
    }
    
    // Mostrar loading
    Swal.fire({
      title: 'Generando reporte...',
      html: 'Por favor esperá un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      // Obtener registros del rango de fechas
      const snapshot = await db.collection("registros")
        .where("fecha", ">=", fechaInicio)
        .where("fecha", "<=", fechaFin)
        .get();
      
      // Inicializar contadores
      const contadores = {};
      RANGOS_PRECIOS.forEach(rango => {
        contadores[rango.label] = {
          cantidad: 0,
          total: 0,
          precio: rango.precio
        };
      });
      
      let totalGeneral = 0;
      let totalInstalaciones = 0;
      
      // Procesar cada registro
      snapshot.forEach(doc => {
        const data = doc.data();
        const metros = Number(data.metros);
        const precio = obtenerPrecioPorMetros(metros);
        
        if (precio > 0) {
          totalInstalaciones++;
          totalGeneral += precio;
          
          // Encontrar el rango correcto
          for (const rango of RANGOS_PRECIOS) {
            if (metros > rango.min && metros <= rango.max) {
              contadores[rango.label].cantidad++;
              contadores[rango.label].total += precio;
              break;
            }
          }
          
          // Si es mayor a 300, contar en el último rango
          if (metros > 300) {
            const ultimoRango = RANGOS_PRECIOS[RANGOS_PRECIOS.length - 1];
            contadores[ultimoRango.label].cantidad++;
            contadores[ultimoRango.label].total += precio;
          }
        }
      });
      
      // Actualizar las tarjetas con los resultados
      RANGOS_PRECIOS.forEach(rango => {
        const tarjeta = document.querySelector(`.tarjeta-resumen[data-rango="${rango.label}"]`);
        if (tarjeta) {
          const cantidad = tarjeta.querySelector(".cantidad");
          const monto = tarjeta.querySelector(".monto");
          
          const datos = contadores[rango.label];
          cantidad.textContent = `${datos.cantidad} instalacion${datos.cantidad !== 1 ? 'es' : ''}`;
          monto.textContent = formatearMoneda(datos.total);
          
          // Aplicar estado de visibilidad actual
          if (montosOcultos) {
            monto.classList.add("oculto");
            monto.classList.remove("visible");
          } else {
            monto.classList.add("visible");
            monto.classList.remove("oculto");
          }
        }
      });
      
      // Actualizar total
      const totalMonto = document.getElementById("totalIngresos");
      const totalInstalacionesTexto = document.querySelector(".total-instalaciones");
      
      if (totalMonto) {
        totalMonto.textContent = formatearMoneda(totalGeneral);
        
        // Aplicar estado de visibilidad actual
        if (montosOcultos) {
          totalMonto.classList.add("oculto");
          totalMonto.classList.remove("visible");
        } else {
          totalMonto.classList.add("visible");
          totalMonto.classList.remove("oculto");
        }
      }
      
      if (totalInstalacionesTexto) {
        totalInstalacionesTexto.textContent = `${totalInstalaciones} instalacion${totalInstalaciones !== 1 ? 'es' : ''} en total`;
      }
      
      // Mostrar resultados
      resultadosReporte.style.display = "block";
      
      // Scroll suave hacia los resultados
      resultadosReporte.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      Swal.close();
      
      // Mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Reporte generado!',
        text: `Se encontraron ${totalInstalaciones} instalaciones`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
      
    } catch (error) {
      console.error("Error al generar reporte:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al generar el reporte',
        confirmButtonColor: "#667eea",
        customClass: {
          icon: 'swal2-icon-custom'
        }
      });
    }
  });
}

// ===============================
// 🗑️ FUNCIÓN PARA REGISTRAR ELIMINACIONES
// ===============================

async function registrarEliminacion(docId, data) {
  try {
    const usuarioActual = auth.currentUser;
    
    await db.collection("registros_eliminados").add({
      // Datos del registro original
      tramite: data.tramite,
      cliente: data.cliente,
      direccion: data.direccion,
      metros: data.metros,
      fecha: data.fecha,
      empleado: data.empleado,
      hora: data.hora,
      horaFin: data.horaFin,
      observaciones: data.observaciones || "",
      mes: data.mes,
      año: data.año,
      
      // Datos de la eliminación
      registroOriginalId: docId,
      eliminadoPor: usuarioActual ? usuarioActual.email : "Usuario desconocido",
      eliminadoEn: new Date().toISOString(),
      timestampEliminacion: firebase.firestore.FieldValue.serverTimestamp(),
      
      // Metadatos adicionales
      motivoEliminacion: "Eliminación manual",
      navegador: navigator.userAgent
    });
    
    console.log("✅ Eliminación registrada correctamente en 'registros_eliminados'");
    return true;
  } catch (error) {
    console.error("❌ Error al registrar eliminación:", error);
    throw error; // Propagar el error para manejarlo en la función que llama
  }
}

// ===============================
// 📋 VER REGISTROS ELIMINADOS
// ===============================
async function verRegistrosEliminados() {
  try {
    const snapshot = await db.collection("registros_eliminados")
      .orderBy("timestampEliminacion", "desc")
      .get(); // Sin límite, muestra todos
    
    if (snapshot.empty) {
      Swal.fire({
        icon: "info",
        title: "Sin eliminaciones",
        text: "No hay registros eliminados",
        confirmButtonColor: "#667eea"
      });
      return;
    }
    
    let html = '<div style="max-height: 500px; overflow-y: auto;">';
    html += '<table style="width: 100%; font-size: 12px; border-collapse: collapse;">';
    html += '<tr style="background: #f5f5f5;"><th style="padding: 8px; border: 1px solid #ddd;">Fecha</th><th style="padding: 8px; border: 1px solid #ddd;">Cliente</th><th style="padding: 8px; border: 1px solid #ddd;">Trámite</th><th style="padding: 8px; border: 1px solid #ddd;">Eliminado por</th><th style="padding: 8px; border: 1px solid #ddd;">Cuándo</th><th style="padding: 8px; border: 1px solid #ddd;">Acción</th></tr>';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const fechaEliminacion = data.eliminadoEn ? 
        new Date(data.eliminadoEn).toLocaleString('es-AR') : 
        'Desconocida';
      
      html += `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.fecha || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.cliente || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.tramite || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${data.eliminadoPor || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${fechaEliminacion}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <button 
            onclick="restaurarRegistro('${doc.id}')" 
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 600;"
          >
            🔄 Restaurar
          </button>
        </td>
      </tr>`;
    });
    
    html += '</table></div>';
    html += `<div style="margin-top: 15px; text-align: center; color: #666; font-size: 13px;">Total: ${snapshot.size} registro(s) eliminado(s)</div>`;
    
    Swal.fire({
      icon: "info",
      title: "📋 Registros Eliminados",
      html: html,
      width: '900px',
      confirmButtonColor: "#667eea"
    });
    
  } catch (error) {
    console.error("Error al obtener eliminados:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los registros eliminados",
      confirmButtonColor: "#667eea"
    });
  }
}

// ===============================
// 🔄 RESTAURAR REGISTRO
// ===============================
async function restaurarRegistro(docEliminadoId) {
  const confirmar = await Swal.fire({
    icon: "question",
    title: "¿Restaurar registro?",
    text: "El registro volverá a la tabla principal",
    showCancelButton: true,
    confirmButtonText: "Sí, restaurar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#667eea",
    cancelButtonColor: "#aaa"
  });
  
  if (!confirmar.isConfirmed) return;
  
  try {
    const docEliminado = await db.collection("registros_eliminados").doc(docEliminadoId).get();
    
    if (!docEliminado.exists) {
      throw new Error("Registro eliminado no encontrado");
    }
    
    const data = docEliminado.data();
    
    const datosRestaurados = {
      tramite: data.tramite,
      cliente: data.cliente,
      direccion: data.direccion,
      metros: data.metros,
      fecha: data.fecha,
      empleado: data.empleado,
      hora: data.hora,
      horaFin: data.horaFin,
      observaciones: data.observaciones || "",
      mes: data.mes,
      año: data.año,
      timestamp: new Date()
    };
    
    await db.collection("registros").add(datosRestaurados);
    
    await db.collection("registros_eliminados").doc(docEliminadoId).update({
      restaurado: true,
      restauradoEn: new Date().toISOString(),
      restauradoPor: auth.currentUser ? auth.currentUser.email : "Usuario desconocido"
    });
    
    Swal.fire({
      icon: "success",
      title: "¡Restaurado!",
      text: "El registro fue restaurado exitosamente",
      timer: 2000,
      showConfirmButton: false
    });
    
    mostrarRegistros(mesActual, añoActual);
    
    setTimeout(() => {
      verRegistrosEliminados();
    }, 2100);
    
  } catch (error) {
    console.error("Error al restaurar:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo restaurar el registro",
      confirmButtonColor: "#667eea"
    });
  }
}
});
