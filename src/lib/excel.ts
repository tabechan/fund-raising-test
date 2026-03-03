import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Converts an ArrayBuffer (Excel file) to a PDF Base64 string
 * Preserves basic layout and merged cells
 */
export async function excelToPdfBase64(arrayBuffer: ArrayBuffer): Promise<string | undefined> {
    try {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON rows for autotable
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
        if (data.length === 0) return undefined;

        const doc = new jsPDF();

        // Use functional call for autoTable as it's more reliable in ESM environments
        autoTable(doc, {
            head: [data[0]],
            body: data.slice(1),
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 1,
            },
            headStyles: { fillColor: [200, 200, 200] },
        });

        const pdfBase64 = doc.output('datauristring').split(',')[1];
        return pdfBase64;
    } catch (e) {
        console.error("Excel to PDF conversion failed:", e);
        return undefined;
    }
}

/**
 * Converts an ArrayBuffer (Excel file) to CSV string
 */
export async function excelToCsv(arrayBuffer: ArrayBuffer): Promise<string | undefined> {
    try {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return XLSX.utils.sheet_to_csv(worksheet);
    } catch (e) {
        console.error("Excel conversion failed:", e);
        return undefined;
    }
}

/**
 * Checks if a file is an Excel file based on name or type
 */
export function isExcelFile(file: File): boolean {
    return (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls")
    );
}

/**
 * Gets the correct MIME type for Excel files
 */
export function getExcelMimeType(file: File): string {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    if (file.name.toLowerCase().endsWith(".xls")) {
        return "application/vnd.ms-excel";
    }
    return file.type || "application/octet-stream";
}
