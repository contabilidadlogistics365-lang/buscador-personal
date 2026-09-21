// Referencias a elementos HTML
const searchInput = document.getElementById('searchInput');
const resultsTable = document.getElementById('resultsTable');
const outputText = document.getElementById('outputText');
const selectedCountEl = document.getElementById('selectedCount');
const totalCountEl = document.getElementById('totalCount');
const btnSelectAll = document.getElementById('btnSelectAll');
const btnClear = document.getElementById('btnClear');
const btnCopy = document.getElementById('btnCopy');
const btnExportExcel = document.getElementById('btnExportExcel');
const copyMessage = document.getElementById('copyMessage');

// Estado
let seleccionados = new Set();
let visiblesActualmente = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  if (typeof trabajadores !== 'undefined' && trabajadores.length > 0) {
    totalCountEl.textContent = trabajadores.length;
    renderizarTabla(trabajadores);
  } else {
    resultsTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444;">No se encontró información en la base de datos.</td></tr>`;
  }
});

// Normalizar texto (ignorar tildes y mayúsculas)
function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Búsqueda en tiempo real
searchInput.addEventListener('input', (e) => {
  const busqueda = normalizarTexto(e.target.value.trim());
  visiblesActualmente = trabajadores.filter(t => normalizarTexto(t.nombre).includes(busqueda));
  renderizarTabla(visiblesActualmente);
});

// Renderizar filas
function renderizarTabla(lista) {
  visiblesActualmente = lista;
  resultsTable.innerHTML = '';

  if (lista.length === 0) {
    resultsTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No se encontraron coincidencias</td></tr>`;
    return;
  }

  lista.forEach(t => {
    const isChecked = seleccionados.has(t.documento) ? 'checked' : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-doc="${t.documento}" ${isChecked} class="chk-trabajador"></td>
      <td>${t.tipoDoc}</td>
      <td>${t.documento}</td>
      <td>${t.nombre}</td>
    `;
    resultsTable.appendChild(tr);
  });

  escucharCheckboxes();
}

// Escuchar checkboxes
function escucharCheckboxes() {
  const checkboxes = document.querySelectorAll('.chk-trabajador');
  checkboxes.forEach(chk => {
    chk.addEventListener('change', (e) => {
      const doc = e.target.getAttribute('data-doc');
      if (e.target.checked) {
        seleccionados.add(doc);
      } else {
        seleccionados.delete(doc);
      }
      actualizarSalida();
    });
  });
}

// Seleccionar todos
btnSelectAll.addEventListener('click', () => {
  visiblesActualmente.forEach(t => seleccionados.add(t.documento));
  renderizarTabla(visiblesActualmente);
  actualizarSalida();
});

// Limpiar selección
btnClear.addEventListener('click', () => {
  seleccionados.clear();
  renderizarTabla(visiblesActualmente);
  actualizarSalida();
});

// Actualizar salida y contadores
function actualizarSalida() {
  const listaSeleccionados = trabajadores.filter(t => seleccionados.has(t.documento));
  const lineas = listaSeleccionados.map(t => `${t.tipoDoc}\t${t.documento}\t${t.nombre}`);
  outputText.value = lineas.join('\n');
  selectedCountEl.textContent = seleccionados.size;
  copyMessage.textContent = '';
}

// Copiar al portapapeles
btnCopy.addEventListener('click', () => {
  if (outputText.value.trim() === '') {
    copyMessage.style.color = '#ef4444';
    copyMessage.textContent = '⚠️ No hay trabajadores seleccionados para copiar.';
    return;
  }

  navigator.clipboard.writeText(outputText.value).then(() => {
    copyMessage.style.color = '#16a34a';
    copyMessage.textContent = '✅ Información copiada correctamente. Lista para pegar (Ctrl + V).';
  }).catch(() => {
    copyMessage.style.color = '#ef4444';
    copyMessage.textContent = '❌ Error al copiar al portapapeles.';
  });
});

// Exportar a Excel
btnExportExcel.addEventListener('click', () => {
  const listaSeleccionados = trabajadores.filter(t => seleccionados.has(t.documento));
  
  if (listaSeleccionados.length === 0) {
    alert('Por favor selecciona al menos un trabajador para exportar.');
    return;
  }

  const dataParaExcel = listaSeleccionados.map(t => ({
    'Tipo de documento': t.tipoDoc,
    'Documento': t.documento,
    'Nombre': t.nombre
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Seleccionados");
  XLSX.writeFile(workbook, "trabajadores_seleccionados.xlsx");
});