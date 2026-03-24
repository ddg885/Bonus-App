export function uploadZone(id, label, loaded) {
  return `<label class="upload-zone ${loaded ? 'loaded' : ''}">
    <input type="file" data-upload="${id}" accept=".csv,.xlsx" hidden />
    <strong>${label}</strong>
    <span>${loaded ? 'Loaded' : 'Drop CSV/XLSX or click to upload'}</span>
  </label>`;
}
