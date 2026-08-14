import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Reading, SensorType } from '../types/marea';

export interface ParsedData {
  headers: string[];
  rows: any[];
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } else if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            resolve({ headers: [], rows: [] });
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map(row => {
            const rowData: any = {};
            headers.forEach((header, index) => {
              rowData[header] = (row as any[])[index];
            });
            return rowData;
          });

          resolve({ headers, rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error('Format de fichier non supporté. Utilisez .csv ou .xlsx');
  }
}
