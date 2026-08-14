import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { parseFile, ParsedData } from '../lib/parseFile';
import { insertReadings } from '../lib/db';
import { SensorType } from '../types/marea';

type Mapping = {
  timestamp: string;
  sensor_type: string;
  value: string;
};

export function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Mapping>({ timestamp: '', sensor_type: '', value: '' });
  const [status, setStatus] = useState<'idle' | 'parsing' | 'mapping' | 'importing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus('parsing');
    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);
      // Auto-guess mapping
      setMapping({
        timestamp: data.headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time')) || '',
        sensor_type: data.headers.find(h => h.toLowerCase().includes('type') || h.toLowerCase().includes('capteur') || h.toLowerCase().includes('param')) || '',
        value: data.headers.find(h => h.toLowerCase().includes('val')) || '',
      });
      setStatus('mapping');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Erreur lors de la lecture du fichier.');
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    setStatus('importing');

    try {
      const readingsToInsert = parsedData.rows
        .filter(row => row[mapping.timestamp] && row[mapping.sensor_type] && row[mapping.value])
        .map(row => {
          let sensorStr = String(row[mapping.sensor_type]).toLowerCase();
          let sensorType: SensorType = 'temperature'; // default
          
          if (sensorStr.includes('ph')) sensorType = 'ph';
          else if (sensorStr.includes('sal') || sensorStr.includes('psu')) sensorType = 'salinity';
          else if (sensorStr.includes('turb') || sensorStr.includes('ntu')) sensorType = 'turbidity';
          else if (sensorStr.includes('temp') || sensorStr.includes('c')) sensorType = 'temperature';

          // parse date - try basic if string
          let ts = row[mapping.timestamp];
          let timestamp = new Date().toISOString();
          if (typeof ts === 'number') {
            // Excel date number
            timestamp = new Date((ts - (25567 + 2)) * 86400 * 1000).toISOString();
          } else if (typeof ts === 'string') {
            const parsed = new Date(ts);
            if (!isNaN(parsed.getTime())) {
              timestamp = parsed.toISOString();
            }
          }

          let val = parseFloat(row[mapping.value]);

          return {
            timestamp,
            sensor_type: sensorType,
            value: isNaN(val) ? 0 : val,
            unit: '', // Could be mapped too, keeping it simple for MVP
            source: 'historical' as const,
          };
        });

      insertReadings(readingsToInsert);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('Erreur lors de l\'importation en base de données.');
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Import de données historiques</h1>
        <p className="text-slate-500 mt-1">Importez vos fichiers de mesures antérieures (.csv, .xlsx).</p>
      </header>

      {status === 'idle' || status === 'error' ? (
        <div 
          className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Cliquez pour ajouter un fichier</h3>
          <p className="text-sm text-slate-500 mt-1">Seuls les formats CSV et Excel sont supportés.</p>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>
      ) : null}

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}

      {status === 'mapping' && parsedData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Correspondance des colonnes</h2>
            <p className="text-sm text-slate-500 mt-1">Associez les colonnes de votre fichier ({file?.name}) aux champs MAREA.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date / Heure</label>
                <select 
                  className="w-full border-slate-300 rounded-lg text-sm"
                  value={mapping.timestamp}
                  onChange={e => setMapping({...mapping, timestamp: e.target.value})}
                >
                  <option value="">Sélectionner une colonne...</option>
                  {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de capteur</label>
                <select 
                  className="w-full border-slate-300 rounded-lg text-sm"
                  value={mapping.sensor_type}
                  onChange={e => setMapping({...mapping, sensor_type: e.target.value})}
                >
                  <option value="">Sélectionner une colonne...</option>
                  {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valeur</label>
                <select 
                  className="w-full border-slate-300 rounded-lg text-sm"
                  value={mapping.value}
                  onChange={e => setMapping({...mapping, value: e.target.value})}
                >
                  <option value="">Sélectionner une colonne...</option>
                  {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={reset} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Annuler</button>
              <button 
                onClick={handleImport}
                disabled={!mapping.timestamp || !mapping.sensor_type || !mapping.value}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Importer {parsedData.rows.length} lignes
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-6">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Aperçu (5 premières lignes)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                  <tr>
                    {parsedData.headers.map(h => (
                      <th key={h} className="px-4 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      {parsedData.headers.map(h => (
                        <td key={h} className="px-4 py-2 truncate max-w-xs">{String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-900">Import réussi !</h3>
          <p className="text-sm text-green-700 mt-1">Vos données ont été ajoutées à la base.</p>
          <button 
            onClick={reset}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Importer un autre fichier
          </button>
        </div>
      )}
    </div>
  );
}
