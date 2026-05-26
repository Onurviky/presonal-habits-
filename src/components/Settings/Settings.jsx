import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import styles from './Settings.module.css';

function MicrovictoryEditor({ items, onAdd, onUpdate, onDelete }) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim());
    setNewLabel('');
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditLabel(item.label);
  }

  function saveEdit(id) {
    if (editLabel.trim()) onUpdate(id, editLabel.trim());
    setEditingId(null);
  }

  return (
    <div className={styles.mvEditor}>
      <form className={styles.mvAddForm} onSubmit={handleAdd}>
        <input
          className={styles.input}
          placeholder="Nueva microvictoria…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
        />
        <button type="submit" className={styles.btnAdd}>+ Agregar</button>
      </form>

      <div className={styles.mvList}>
        {items.map((item, i) => (
          <div key={item.id} className={styles.mvRow}>
            <span className={styles.mvIndex}>{i + 1}</span>
            {editingId === item.id ? (
              <input
                className={styles.input}
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                autoFocus
              />
            ) : (
              <span className={styles.mvLabel} onDoubleClick={() => startEdit(item)}>{item.label}</span>
            )}
            <div className={styles.mvActions}>
              <button className={styles.mvBtn} onClick={() => startEdit(item)} title="Editar">✎</button>
              <button
                className={`${styles.mvBtn} ${styles.mvBtnDanger}`}
                onClick={() => {
                  if (window.confirm('¿Eliminar esta microvictoria?')) onDelete(item.id);
                }}
                title="Eliminar"
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const {
    userName, setUserName,
    microvictoriesBase, addMicrovictoryBase, updateMicrovictoryBase, deleteMicrovictoryBase,
    exportData, importData, resetAllData,
  } = useApp();

  const [name, setName] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);
  const [resetStep, setResetStep] = useState(0);
  const fileRef = useRef(null);

  function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setUserName(name.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importData(data);
        alert('¡Datos importados correctamente!');
      } catch {
        alert('Error: el archivo no es un JSON válido de Life Tracker.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleReset() {
    if (resetStep === 0) {
      setResetStep(1);
    } else if (resetStep === 1) {
      setResetStep(2);
    } else {
      resetAllData();
      setResetStep(0);
      alert('Todos los datos han sido eliminados.');
    }
  }

  const resetLabels = [
    'Resetear todo',
    '⚠️ ¿Estás seguro? (Confirmá de nuevo)',
    '🔴 ÚLTIMA CONFIRMACIÓN — ¡Esto borra todo!',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ajustes</h2>
        <p className={styles.subtitle}>Configurá tu experiencia en Life Tracker</p>
      </div>

      {/* User section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Perfil</div>
        <form className={styles.nameForm} onSubmit={handleSaveName}>
          <div className={styles.field}>
            <label className={styles.label}>Tu nombre</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="¿Cómo te llamás?"
            />
          </div>
          <button type="submit" className={`${styles.btnPrimary} ${nameSaved ? styles.btnSaved : ''}`}>
            {nameSaved ? '✓ Guardado' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Microvictories */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Lista de microvictorias base</div>
        <p className={styles.sectionDesc}>Estas son las 10 microvictorias que aparecen cada día. Podés editarlas, reordenarlas o eliminarlas.</p>
        <MicrovictoryEditor
          items={microvictoriesBase}
          onAdd={addMicrovictoryBase}
          onUpdate={updateMicrovictoryBase}
          onDelete={deleteMicrovictoryBase}
        />
      </div>

      {/* Data management */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Datos</div>
        <div className={styles.dataActions}>
          <div className={styles.dataAction}>
            <div className={styles.dataActionInfo}>
              <div className={styles.dataActionTitle}>Exportar datos</div>
              <div className={styles.dataActionDesc}>Descarga todos tus datos como archivo JSON.</div>
            </div>
            <button className={styles.btnSecondary} onClick={exportData}>
              ↓ Exportar JSON
            </button>
          </div>

          <div className={styles.dataAction}>
            <div className={styles.dataActionInfo}>
              <div className={styles.dataActionTitle}>Importar datos</div>
              <div className={styles.dataActionDesc}>Importa un archivo JSON exportado previamente.</div>
            </div>
            <button className={styles.btnSecondary} onClick={() => fileRef.current?.click()}>
              ↑ Importar JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>

          <div className={`${styles.dataAction} ${styles.dataActionDanger}`}>
            <div className={styles.dataActionInfo}>
              <div className={styles.dataActionTitle}>Resetear todos los datos</div>
              <div className={styles.dataActionDesc}>Elimina permanentemente todos tus registros. Esta acción no se puede deshacer.</div>
            </div>
            <button
              className={styles.btnDanger}
              onClick={handleReset}
              onBlur={() => setTimeout(() => setResetStep(0), 3000)}
            >
              {resetLabels[resetStep]}
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Acerca de</div>
        <div className={styles.about}>
          <p><strong>Life Tracker</strong> — Dashboard personal de seguimiento diario.</p>
          <p>Todos los datos se guardan localmente en tu navegador (localStorage). No se envía nada a ningún servidor.</p>
        </div>
      </div>
    </div>
  );
}
