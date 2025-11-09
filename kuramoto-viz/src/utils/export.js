import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

/**
 * Export utilities for data and screenshots
 */

/**
 * Export current data as CSV
 */
export async function exportCSV(history, filename = 'kuramoto-data.csv') {
  const { time, orderParameter, phases } = history;

  if (!time || time.length === 0) {
    throw new Error('No data to export');
  }

  // Create CSV header
  const N = phases[0]?.length || 0;
  const headers = ['Time', 'OrderParameter'];
  for (let i = 0; i < N; i++) {
    headers.push(`Oscillator_${i}`);
  }

  // Create CSV rows
  const rows = [headers.join(',')];

  for (let t = 0; t < time.length; t++) {
    const row = [time[t].toFixed(4), orderParameter[t].toFixed(6)];
    for (let i = 0; i < N; i++) {
      row.push(phases[t][i].toFixed(6));
    }
    rows.push(row.join(','));
  }

  // Create blob and download
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

/**
 * Export screenshot of element
 */
export async function exportScreenshot(elementId, filename = 'kuramoto-screenshot.png') {
  const element = document.getElementById(elementId) || document.body;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#e0e5ec',
      scale: 2, // Higher quality
      logging: false
    });

    canvas.toBlob((blob) => {
      saveAs(blob, filename);
    });
  } catch (error) {
    console.error('Screenshot export failed:', error);
    throw error;
  }
}

/**
 * Export current parameters as JSON
 */
export function exportParameters(parameters, network, filename = 'kuramoto-config.json') {
  const config = {
    timestamp: new Date().toISOString(),
    parameters,
    network: {
      type: network.type,
      ...network
    }
  };

  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, filename);
}

/**
 * Format data for clipboard
 */
export function copyDataToClipboard(history) {
  const { time, orderParameter } = history;

  if (!time || time.length === 0) {
    return false;
  }

  // Create tab-separated format for easy pasting into Excel
  const headers = ['Time', 'Order Parameter'].join('\t');
  const rows = time.map((t, i) => `${t.toFixed(4)}\t${orderParameter[i].toFixed(6)}`);

  const data = [headers, ...rows].join('\n');

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(data);
    return true;
  }

  return false;
}
