// ========== MENÚ RESPONSIVE (FUNCIÓN GLOBAL) ==========

function responsiveMenu() {
    const navMenu = document.getElementById("navMenu");
    if (navMenu) {
        navMenu.classList.toggle("show");
    }
}

// ========== EVENTO PRINCIPAL ==========
document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  // ========== EVENTOS DEL MENÚ ==========
  const navLinks = document.querySelectorAll(".nav-link");
  const navMenu = document.getElementById("navMenu");
  
  if (navLinks && navMenu) {
      navLinks.forEach(link => {
          link.addEventListener("click", () => {
              if (window.innerWidth <= 768) {
                  navMenu.classList.remove("show");
              }
          });
      });
  }

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", (e) => {
      const navbar = document.querySelector(".admin-navbar");
      const iconoNav = document.getElementById("icono-nav");
      
      if (navbar && navMenu && !navbar.contains(e.target) && navMenu.classList.contains("show")) {
          navMenu.classList.remove("show");
      }
  });

  // ==========================================
  // 🔐 PÁGINAS PROTEGIDAS - COMENTADO TEMPORALMENTE
  // ==========================================
  const PAGINAS_PROTEGIDAS = {
    'eliminados.html': true,
    'facturacion.html': true
  };

  const paginaActual = window.location.pathname.split('/').pop();

  // 🔒 PROTECCIÓN PRINCIPAL: Verificar usuario logueado
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      window.location.href = "formulario.html";
      return;
    }

    // Verificar si la página actual requiere permisos especiales
    if (PAGINAS_PROTEGIDAS[paginaActual]) {
      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();

        if (!userDoc.exists) {
          mostrarAccesoDenegado();
          return;
        }

        const userData = userDoc.data();

        if (!userData.permisos || !userData.permisos[paginaActual]) {
          mostrarAccesoDenegado();
          return;
        }

        mostrarContenido();

      } catch (error) {
        console.error("Error verificando permisos:", error);
        mostrarAccesoDenegado();
      }
    } else {
      mostrarContenido();
    }
    
  });

  // Funciones auxiliares
  function mostrarAccesoDenegado() {
    const container = document.getElementById("accessContainer");
    if (container) {
      container.style.display = "flex";
      const loader = container.querySelector(".loader");
      const message = container.querySelector(".message");
      const errorBox = container.querySelector("#errorBox");

      if (loader) loader.style.display = "none";
      if (message) message.style.display = "none";
      if (errorBox) errorBox.style.display = "block";
    }

    const mainContent = document.querySelector("main, .main-content, .container, .facturacion-section, .content-section");
    if (mainContent) mainContent.style.display = "none";
  }

  function mostrarContenido() {
    const container = document.getElementById("accessContainer");
    if (container) {
      container.style.display = "none";
    }

    const mainContent = document.querySelector("main, .main-content, .container");
    if (mainContent) mainContent.style.display = "block";

    const facturacionSection = document.querySelector(".facturacion-section");
    if (facturacionSection) facturacionSection.style.display = "flex";

    const contentSection = document.querySelector(".content-section");
    if (contentSection) contentSection.style.display = "flex";
  }

  // 🚪 Botón de cerrar sesión
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "index.html";
      } catch (err) {
        alert("Error al cerrar sesión: " + err.message);
      }
    });
  }

  // ===============================
  // 📋 FORMULARIO: AGREGAR O EDITAR REGISTRO (SOLO EN FORMULARIO.HTML)
  // ===============================
  const registroForm = document.getElementById("registroForm");
  let editandoId = null;

  if (registroForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
      editandoId = editId;
      db.collection("registros").doc(editId).get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          document.getElementById("tramite").value = data.tramite;
          document.getElementById("cliente").value = data.cliente;
          document.getElementById("direccion").value = data.direccion;
          document.getElementById("metros").value = data.metros;
          document.getElementById("fecha").value = data.fecha;
          document.getElementById("empleado").value = data.empleado;
          document.getElementById("hora").value = data.hora;
          document.getElementById("horaFin").value = data.horaFin;
          document.getElementById("observaciones").value = data.observaciones || "";
        }
      });
    }

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

      const [anioFecha, mesFecha, diaFecha] = fecha.split('-').map(Number);

      try {
        if (editandoId) {
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
          Swal.fire({
            icon: 'success',
            title: '✅ Registro actualizado',
            showConfirmButton: false,
            timer: 2000,
            toast: true,
            position: 'top-end',
            customClass: {
              icon: 'swal2-icon-custom'
            }
          });
          editandoId = null;
          window.history.replaceState({}, document.title, "formulario.html");
        } else {
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
  }

  // ===============================
  // 📄 MOSTRAR REGISTROS EN TABLA (SOLO EN CLIENTES.HTML)
  // ===============================
  const tabla = document.getElementById("tablaRegistros");
  if (tabla) {
    const tbody = tabla.getElementsByTagName("tbody")[0];
    let mesActual = new Date().getMonth() + 1;
    let añoActual = new Date().getFullYear();

    let menuAbiertoActual = null;

    function configurarMenuAcciones(row, menuBtn, accionesOpciones) {
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        if (menuAbiertoActual && menuAbiertoActual !== accionesOpciones) {
          menuAbiertoActual.classList.add("hidden");
        }
        
        accionesOpciones.classList.toggle("hidden");
        
        if (!accionesOpciones.classList.contains("hidden")) {
          menuAbiertoActual = accionesOpciones;
        } else {
          menuAbiertoActual = null;
        }
      });
    }

    function configurarBotonEditar(boton, docId, data) {
      boton.addEventListener("click", () => {
        window.location.href = `formulario.html?edit=${docId}`;
      });
    }

    async function registrarEliminacion(docId, data) {
      try {
        const usuarioActual = auth.currentUser;
        
        const eliminadosExistentes = await db.collection("registros_eliminados")
          .where("registroOriginalId", "==", docId)
          .get();
        
        if (!eliminadosExistentes.empty) {
          const docEliminado = eliminadosExistentes.docs[0];
          const historialActual = docEliminado.data().historial || [];
          
          historialActual.push({
            accion: "eliminado",
            fecha: new Date().toISOString(),
            usuario: usuarioActual ? usuarioActual.email : "Usuario desconocido",
            navegador: navigator.userAgent
          });
          
          await db.collection("registros_eliminados").doc(docEliminado.id).update({
            historial: historialActual,
            ultimaAccion: "eliminado",
            ultimaAccionFecha: new Date().toISOString(),
            vecesEliminado: (docEliminado.data().vecesEliminado || 1) + 1
          });
          
        } else {
          await db.collection("registros_eliminados").add({
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
            registroOriginalId: docId,
            eliminadoPor: usuarioActual ? usuarioActual.email : "Usuario desconocido",
            eliminadoEn: new Date().toISOString(),
            timestampEliminacion: firebase.firestore.FieldValue.serverTimestamp(),
            historial: [{
              accion: "eliminado",
              fecha: new Date().toISOString(),
              usuario: usuarioActual ? usuarioActual.email : "Usuario desconocido",
              navegador: navigator.userAgent
            }],
            ultimaAccion: "eliminado",
            ultimaAccionFecha: new Date().toISOString(),
            vecesEliminado: 1,
            vecesRestaurado: 0
          });
        }
        
        console.log("✅ Eliminación registrada correctamente");
        return true;
      } catch (error) {
        console.error("❌ Error al registrar eliminación:", error);
        throw error;
      }
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
                const doc = await db.collection("registros").doc(docId).get();
                const data = doc.data();
                
                await registrarEliminacion(docId, data);
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

    function mostrarRegistros(mes = mesActual, año = añoActual) {
      db.collection("registros")
        .where("mes", "==", mes)
        .where("año", "==", año)
        .orderBy("fecha", "desc")
        .onSnapshot(snapshot => {
          tbody.innerHTML = "";
          
          if (snapshot.empty) {
            tbody.innerHTML = `
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
            const row = tbody.insertRow();
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

    document.addEventListener("click", (e) => {
      if (menuAbiertoActual && !e.target.closest(".acciones-container")) {
        menuAbiertoActual.classList.add("hidden");
        menuAbiertoActual = null;
      }
    });

    function cambiarMesTabla(mes, año) {
      mesActual = mes;
      añoActual = año;
      mostrarRegistros(mes, año);
    }

    mostrarRegistros();

    // 🔍 BUSCAR EN TABLA
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
        
        tbody.innerHTML = "";
        let encontrados = 0;
        
        let contadorPorEmpleado = {};
        let fechaBuscada = null;
        let empleadosBuscados = [];
        
        const buscaAldo = filter.includes("aldo");
        const buscaAngel = filter.includes("angel");
        
        if (buscaAldo) empleadosBuscados.push("aldo");
        if (buscaAngel) empleadosBuscados.push("angel");
        
        const esFecha = /\d{1,2}\/\d{1,2}\/\d{4}/.test(filter) || /\d{4}-\d{1,2}-\d{1,2}/.test(filter);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const texto = `${data.tramite} ${data.cliente} ${data.direccion} ${data.metros} ${data.fecha} ${data.empleado} ${data.observaciones}`.toLowerCase();
          
          if (texto.includes(filter)) {
            encontrados++;
            
            if (esFecha && data.empleado && empleadosBuscados.length > 0) {
              const empleado = data.empleado.toLowerCase().trim();
              
              if (empleadosBuscados.includes(empleado)) {
                if (!contadorPorEmpleado[empleado]) {
                  contadorPorEmpleado[empleado] = 0;
                }
                contadorPorEmpleado[empleado]++;
                
                if (!fechaBuscada && data.fecha) {
                  fechaBuscada = data.fecha;
                }
              }
            }
            
            const row = tbody.insertRow();
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
          tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No se encontraron resultados</td></tr>`;
        } else if (esFecha && Object.keys(contadorPorEmpleado).length > 0) {
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

    // 📄 EXPORTAR PDF
    const exportBtn = document.getElementById("exportBtn");

    if (exportBtn) {
      function crearMenuMeses() {
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        const menu = document.createElement("div");
        menu.style.cssText = "position:fixed;background:white;border:1px solid #ccc;padding:5px;display:none;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.15);width:250px;max-height:300px;overflow-y:auto;border-radius:8px";
        menu.id = "menuMesesPdf";

        meses.forEach((mes, index) => {
          const item = document.createElement("div");
          item.style.cssText = "padding:8px 10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background-color 0.2s ease";
          item.dataset.mesNumero = index + 1;
          
          const nombreMes = document.createElement("span");
          nombreMes.textContent = mes;
          nombreMes.style.flex = "1";
          nombreMes.dataset.mes = index + 1;
          
          const btnDescargar = document.createElement("button");
          btnDescargar.innerHTML = "📥";
          btnDescargar.style.cssText = "background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border:none;border-radius:5px;padding:5px 10px;cursor:pointer;font-size:16px";
          btnDescargar.dataset.mes = index + 1;
          
          nombreMes.addEventListener("click", (e) => {
            e.stopPropagation();
            cambiarMesTabla(Number(nombreMes.dataset.mes), añoActual);
            actualizarMesActivo(Number(nombreMes.dataset.mes));
          });
          
          btnDescargar.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.style.display = "none";
            exportarPdfMes(Number(btnDescargar.dataset.mes));
          });

          item.addEventListener("mouseenter", () => {
            if (!item.classList.contains("mes-activo")) {
              item.style.backgroundColor = "#f0f0f0";
            }
          });

          item.addEventListener("mouseleave", () => {
            if (!item.classList.contains("mes-activo")) {
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

      function actualizarMesActivo(mes) {
        const menuItems = document.querySelectorAll("#menuMesesPdf > div");
        menuItems.forEach(item => {
          if (Number(item.dataset.mesNumero) === mes) {
            item.classList.add("mes-activo");
            item.style.backgroundColor = "#667eea";
            item.style.color = "white";
            item.querySelector("span").style.fontWeight = "bold";
          } else {
            item.classList.remove("mes-activo");
            item.style.backgroundColor = "white";
            item.style.color = "black";
            item.querySelector("span").style.fontWeight = "normal";
          }
        });
      }

      const menuMeses = crearMenuMeses();
      actualizarMesActivo(mesActual);

      function toggleMenu() {
        if (menuMeses.style.display === "block") {
          menuMeses.style.display = "none";
        } else {
          const rect = exportBtn.getBoundingClientRect();
          let top = rect.bottom + 5;
          let left = rect.left;
          
          if (top + 300 > window.innerHeight) {
            top = rect.top - 305;
          }
          if (left + 250 > window.innerWidth) {
            left = window.innerWidth - 260;
          }
          
          menuMeses.style.top = top + "px";
          menuMeses.style.left = left + "px";
          menuMeses.style.display = "block";
        }
      }

      async function exportarPdfMes(mes) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

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

      exportBtn.style.position = "relative";
      const flecha = document.createElement("span");
      flecha.innerHTML = " ▼";
      flecha.style.cursor = "pointer";
      exportBtn.appendChild(flecha);

      exportBtn.addEventListener("click", toggleMenu);

      document.addEventListener("click", (e) => {
        if (!exportBtn.contains(e.target) && !menuMeses.contains(e.target)) {
          menuMeses.style.display = "none";
        }
      });
    }
  }

  // ===============================
  // 💰 REPORTE DE FACTURACIÓN (SOLO EN FACTURACION.HTML)
  // ===============================

  const RANGOS_PRECIOS = [
    { min: 0, max: 50, precio: 25000, label: "0-50" },
    { min: 50, max: 100, precio: 35000, label: "50-100" },
    { min: 100, max: 150, precio: 45000, label: "100-150" },
    { min: 150, max: 200, precio: 55000, label: "150-200" },
    { min: 200, max: 250, precio: 60000, label: "200-250" },
    { min: 250, max: 300, precio: 70000, label: "250-300" }
  ];

  let montosOcultos = false;

  function obtenerPrecioPorMetros(metros) {
    const metrosNum = Number(metros);
    
    for (const rango of RANGOS_PRECIOS) {
      if (metrosNum > rango.min && metrosNum <= rango.max) {
        return rango.precio;
      }
    }
    
    if (metrosNum > 300) {
      return RANGOS_PRECIOS[RANGOS_PRECIOS.length - 1].precio;
    }
    
    return 0;
  }

  function formatearMoneda(numero) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(numero);
  }

  const toggleBtn = document.getElementById("toggleMontos");
  const iconoOjo = document.getElementById("iconoOjo");
  const textoToggle = document.getElementById("textoToggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      montosOcultos = !montosOcultos;
      
      if (montosOcultos) {
        iconoOjo.textContent = "🙈";
        textoToggle.textContent = "Mostrar Montos";
      } else {
        iconoOjo.textContent = "👁️";
        textoToggle.textContent = "Ocultar Montos";
      }
      
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
      
      Swal.fire({
        title: 'Generando reporte...',
        html: 'Por favor esperá un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      try {
        const snapshot = await db.collection("registros")
          .where("fecha", ">=", fechaInicio)
          .where("fecha", "<=", fechaFin)
          .get();
        
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
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const metros = Number(data.metros);
          const precio = obtenerPrecioPorMetros(metros);
          
          if (precio > 0) {
            totalInstalaciones++;
            totalGeneral += precio;
            
            for (const rango of RANGOS_PRECIOS) {
              if (metros > rango.min && metros <= rango.max) {
                contadores[rango.label].cantidad++;
                contadores[rango.label].total += precio;
                break;
              }
            }
            
            if (metros > 300) {
              const ultimoRango = RANGOS_PRECIOS[RANGOS_PRECIOS.length - 1];
              contadores[ultimoRango.label].cantidad++;
              contadores[ultimoRango.label].total += precio;
            }
          }
        });
        
        RANGOS_PRECIOS.forEach(rango => {
          const tarjeta = document.querySelector(`.tarjeta-resumen[data-rango="${rango.label}"]`);
          if (tarjeta) {
            const cantidad = tarjeta.querySelector(".cantidad");
            const monto = tarjeta.querySelector(".monto");
            
            const datos = contadores[rango.label];
            cantidad.textContent = `${datos.cantidad} instalacion${datos.cantidad !== 1 ? 'es' : ''}`;
            monto.textContent = formatearMoneda(datos.total);
            
            if (montosOcultos) {
              monto.classList.add("oculto");
              monto.classList.remove("visible");
            } else {
              monto.classList.add("visible");
              monto.classList.remove("oculto");
            }
          }
        });
        
        const totalMonto = document.getElementById("totalIngresos");
        const totalInstalacionesTexto = document.querySelector(".total-instalaciones");
        
        if (totalMonto) {
          totalMonto.textContent = formatearMoneda(totalGeneral);
          
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
        
        resultadosReporte.style.display = "block";
        resultadosReporte.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        Swal.close();
        
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
  // 🗑️ VER REGISTROS ELIMINADOS (SOLO EN ELIMINADOS.HTML)
  // ===============================

  window.verRegistrosEliminados = async function() {
    try {
      const snapshot = await db.collection("registros_eliminados")
        .orderBy("timestampEliminacion", "desc")
        .get();
      
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
      html += '<tr style="background: #f5f5f5;">';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Fecha</th>';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Cliente</th>';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Trámite</th>';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Estado</th>';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Historial</th>';
      html += '<th style="padding: 8px; border: 1px solid #ddd;">Acción</th>';
      html += '</tr>';
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const historial = data.historial || [];
        
        let estadoHTML = '';
        let estadoColor = '';
        let estaRestaurado = false;
        
        if (!data.ultimaAccion || data.ultimaAccion === "eliminado") {
          estadoHTML = '🗑️ Eliminado';
          estadoColor = '#dc3545';
          estaRestaurado = false;
        } else if (data.ultimaAccion === "restaurado") {
          estadoHTML = '🔄 Restaurado';
          estadoColor = '#28a745';
          estaRestaurado = true;
        }
        
        let historialHTML = '<div style="text-align: left; max-width: 300px;">';
        
        if (historial.length === 0) {
          const fechaEliminacion = data.eliminadoEn ? 
            new Date(data.eliminadoEn).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Fecha desconocida';
          
          historialHTML += `
            <div style="padding: 4px 0; border-bottom: 1px solid #eee; font-size: 11px;">
              <span style="color: #dc3545; font-weight: bold;">🗑️ ELIMINADO</span><br>
              <span style="color: #666;">📅 ${fechaEliminacion}</span><br>
              <span style="color: #666;">👤 ${data.eliminadoPor || 'Usuario desconocido'}</span>
            </div>
          `;
        } else {
          historial.forEach((accion, index) => {
            const fecha = new Date(accion.fecha).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const icono = accion.accion === 'eliminado' ? '🗑️' : '🔄';
            const color = accion.accion === 'eliminado' ? '#dc3545' : '#28a745';
            
            historialHTML += `
              <div style="padding: 4px 0; border-bottom: 1px solid #eee; font-size: 11px;">
                <span style="color: ${color}; font-weight: bold;">${icono} ${accion.accion.toUpperCase()}</span><br>
                <span style="color: #666;">📅 ${fecha}</span><br>
                <span style="color: #666;">👤 ${accion.usuario}</span>
              </div>
            `;
          });
        }
        historialHTML += '</div>';
        
        const vecesEliminado = data.vecesEliminado || 1;
        const vecesRestaurado = data.vecesRestaurado || 0;
        const contadorHTML = `
          <div style="font-size: 10px; color: #666; margin-top: 5px;">
            Eliminado: ${vecesEliminado}x | Restaurado: ${vecesRestaurado}x
          </div>
        `;
        
        html += `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.fecha || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.cliente || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.tramite || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <span style="color: ${estadoColor}; font-weight: bold;">${estadoHTML}</span>
            ${contadorHTML}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${historialHTML}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${!estaRestaurado ? `
              <button 
                onclick="restaurarRegistro('${doc.id}')" 
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 600;"
              >
                🔄 Restaurar
              </button>
            ` : '<span style="color: #999;">Ya restaurado</span>'}
          </td>
        </tr>`;
      });
      
      html += '</table></div>';
      html += `<div style="margin-top: 15px; text-align: center; color: #666; font-size: 13px;">Total: ${snapshot.size} registro(s) en historial</div>`;
      
      Swal.fire({
        icon: "info",
        title: "📋 Historial de Eliminaciones",
        html: html,
        width: '1000px',
        confirmButtonColor: "#667eea"
      });
      
    } catch (error) {
      console.error("Error al obtener eliminados:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los registros eliminados: " + error.message,
        confirmButtonColor: "#667eea"
      });
    }
  };

  // 🔄 RESTAURAR REGISTRO
  window.restaurarRegistro = async function(docEliminadoId) {
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
      
      const historialActual = data.historial || [];
      historialActual.push({
        accion: "restaurado",
        fecha: new Date().toISOString(),
        usuario: auth.currentUser ? auth.currentUser.email : "Usuario desconocido",
        navegador: navigator.userAgent
      });
      
      await db.collection("registros_eliminados").doc(docEliminadoId).update({
        historial: historialActual,
        ultimaAccion: "restaurado",
        ultimaAccionFecha: new Date().toISOString(),
        vecesRestaurado: (data.vecesRestaurado || 0) + 1
      });
      
      Swal.fire({
        icon: "success",
        title: "¡Restaurado!",
        text: "El registro fue restaurado exitosamente",
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error("Error al restaurar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo restaurar el registro: " + error.message,
        confirmButtonColor: "#667eea"
      });
    }
  };

  // Cargar eliminados automáticamente si estamos en eliminados.html
  if (window.location.pathname.includes('eliminados.html')) {
    const tablaEliminados = document.getElementById("tablaEliminados");
    if (tablaEliminados) {
      db.collection("registros_eliminados")
        .orderBy("timestampEliminacion", "desc")
        .onSnapshot(snapshot => {
          const tbody = tablaEliminados.getElementsByTagName("tbody")[0];
          tbody.innerHTML = "";
          
          if (snapshot.empty) {
            tbody.innerHTML = `
              <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                  No hay registros eliminados
                </td>
              </tr>
            `;
            return;
          }
          
          snapshot.forEach(doc => {
            const data = doc.data();
            const row = tbody.insertRow();
            
            const estaRestaurado = data.ultimaAccion === "restaurado";
            const estadoHTML = estaRestaurado ? '🔄 Restaurado' : '🗑️ Eliminado';
            const estadoColor = estaRestaurado ? '#28a745' : '#dc3545';
            
            const fechaEliminacion = data.eliminadoEn ? 
              new Date(data.eliminadoEn).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Fecha desconocida';
            
            row.innerHTML = `
              <td data-label="Fecha">${data.fecha || '-'}</td>
              <td data-label="Cliente">${data.cliente || '-'}</td>
              <td data-label="Trámite">${data.tramite || '-'}</td>
              <td data-label="Empleado">${data.empleado || '-'}</td>
              <td data-label="Estado">
                <span style="color: ${estadoColor}; font-weight: bold;">${estadoHTML}</span>
              </td>
              <td data-label="Eliminado">
                ${fechaEliminacion}<br>
                <small style="color: #666;">por ${data.eliminadoPor || 'Usuario desconocido'}</small>
              </td>
              <td data-label="Acción">
                ${!estaRestaurado ? `
                  <button 
                    onclick="restaurarRegistro('${doc.id}')" 
                    class="btn-restaurar"
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 600;"
                  >
                    🔄 Restaurar
                  </button>
                ` : '<span style="color: #999;">Ya restaurado</span>'}
              </td>
            `;
          });
        });
    }
  }
});