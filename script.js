// Guardamos registros en memoria (localStorage)
    const registros = JSON.parse(localStorage.getItem("registros")) || [];

    const form = document.getElementById("registroForm");
    const tabla = document.getElementById("tablaRegistros").querySelector("tbody");
    const search = document.getElementById("search");
    const exportBtn = document.getElementById("exportBtn");

    // Mostrar los registros en la tabla
    function mostrarRegistros(lista) {
      tabla.innerHTML = "";
      lista.forEach(reg => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${reg.tramite}</td>
          <td>${reg.cliente}</td>
          <td>${reg.direccion}</td>
          <td>${reg.fecha}</td>
          <td>${reg.hora}</td>
          <td>${reg.empleado}</td>
          <td>${reg.observaciones}</td>
        `;
        tabla.appendChild(row);
      });
    }

    // Cargar registros al inicio
    mostrarRegistros(registros);

    // Agregar un nuevo registro
    form.addEventListener("submit", e => {
      e.preventDefault();
      const nuevo = {
        tramite: document.getElementById("tramite").value,
        cliente: document.getElementById("cliente").value,
        direccion: document.getElementById("direccion").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        empleado: document.getElementById("empleado").value,
        observaciones: document.getElementById("observaciones").value,
      };
      registros.push(nuevo);
      localStorage.setItem("registros", JSON.stringify(registros));
      mostrarRegistros(registros);
      form.reset();
    });

    // Buscar en los registros
    search.addEventListener("input", e => {
      const texto = e.target.value.toLowerCase();
      const filtrados = registros.filter(r =>
        r.cliente.toLowerCase().includes(texto) ||
        r.tramite.toLowerCase().includes(texto)
      );
      mostrarRegistros(filtrados);
    });

    // Exportar PDF
    exportBtn.addEventListener("click", () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const mesActual = new Date().toISOString().slice(0,7); // YYYY-MM
      const registrosMes = registros.filter(r => r.fecha.startsWith(mesActual));

      if (registrosMes.length === 0) {
        alert("No hay registros este mes.");
        return;
      }
      doc.text(Registro de Instalaciones - ${mesActual}, 14, 15);

      doc.autoTable({
        startY: 20,
        head: [["Trámite", "Cliente", "Dirección", "Fecha", "Hora", "Empleado", "Observaciones"]],
        body: registrosMes.map(r => [
          r.tramite, r.cliente, r.direccion, r.fecha, r.hora, r.empleado, r.observaciones
        ])
      });

      doc.save(instalaciones_${mesActual}.pdf);
    });