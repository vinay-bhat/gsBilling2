/**
 * Nyx printer receipt utility – same format and conditions as IminiBillingModule
 * Uses NyxPrinter (native) via nyxHelper for counter bill printing.
 * Optimized for 80mm paper width (~48 chars), center-aligned.
 */

import NyxPrinter, {PrintAlign, PrinterStatus} from './nyxHelper';
import {getActiveData} from './sqlite/SqliteFetch';

/** 80mm paper ~48 chars width */
const PAGE_WIDTH = 48;
const SEP =
  '-------------------------------------------------------------------------------';

function toTitleCase(s: string | null | undefined): string {
  if (s == null) return '';
  s = s.trim().replace(/\s+/g, ' ');
  if (!s) return s;
  return s
    .toLowerCase()
    .split(' ')
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .filter(Boolean)
    .join(' ');
}

function getQuantityAsDouble(item: any): number {
  if (item == null || item.qty == null) return 0;
  const q = item.qty;
  if (typeof q === 'number') return q;
  if (typeof q === 'string') return parseFloat(q) || 0;
  return 0;
}

function formatMoney(val: number): string {
  return val.toFixed(2);
}

/** Truncate/pad for 80mm column width */
function truncateName(name: string, maxLen: number): string {
  if (!name || name.length <= maxLen) return name;
  return name.slice(0, maxLen);
}

/** setting_access '1' → SAC mode (single majority HSN above Grand Total); '0' → per-item HSN */
async function isSacDisplayMode(): Promise<boolean> {
  try {
    const settings = await getActiveData('application_settings');
    const setting = settings.find(
      (s: any) => s.setting_name === 'HSN_OR_SAC_DISPLAY_OPTION',
    );
    return setting?.setting_access === '1' || setting?.setting_access === 1;
  } catch (_) {
    return false;
  }
}

/** Returns the HSN code that appears most often across bill items. */
function getMajorityHsnCode(billData: any[]): string {
  const counts = new Map<string, number>();
  for (const item of billData) {
    if (!item) continue;
    const hsn = String(item.hsn_code ?? '').trim();
    if (!hsn) continue;
    counts.set(hsn, (counts.get(hsn) ?? 0) + 1);
  }
  let maxCount = 0;
  let majorityHsn = '';
  for (const [hsn, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      majorityHsn = hsn;
    }
  }
  return majorityHsn;
}

/** masters_status=declaration from masters_creation (synced via sales_urls[0]) */
async function getDeclarationDetails(): Promise<string> {
  try {
    const masters = await getActiveData('masters_creation');
    const declaration = masters.find(
      (m: any) => m.masters_status === 'declaration',
    );
    return String(declaration?.master_details ?? '').trim();
  } catch (_) {
    return '';
  }
}

/** Break into lines at commas when text exceeds page width. */
function formatDeclarationLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.length <= PAGE_WIDTH) {
    return [trimmed];
  }

  const lines: string[] = [];
  const parts = trimmed.split(',');
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i].trim();
    if (!part) continue;
    if (i < parts.length - 1) part += ',';
    lines.push(part.length <= PAGE_WIDTH ? part : part.slice(0, PAGE_WIDTH));
  }
  return lines;
}

function parseGroupedItems(
  groupedItems: string | Record<string, any[]>,
): Record<string, any[]> {
  if (!groupedItems) return {};
  if (typeof groupedItems === 'string') {
    if (!groupedItems.trim()) return {};
    try {
      return JSON.parse(groupedItems);
    } catch (_) {
      return {};
    }
  }
  return groupedItems;
}

export type OnCounterBillGenerateParams = {
  title: string;
  orgname: string;
  gstino: string;
  address1: string;
  address2: string;
  cin_no: string;
  billData: any[];
  branchname: string;
  billId: string;
  billNo: string;
  date: string;
  time: string;
  totalBasic: string;
  grandTotal: string;
  taxableData: string;
  taxAmount: string;
  cgstGroups: Array<{cgst: string; amount: number}>;
  custName: string;
  custMobile: string;
  gstNumber: string;
  showTax: boolean;
};

/**
 * Prints counter bill receipt on Nyx printer with same layout as IminiBillingModule.
 * Calls errorCallback on failure, successCallback on success.
 */
export async function onCounterBillGenerate(
  title: string,
  orgname: string,
  gstino: string,
  address1: string,
  address2: string,
  cin_no: string,
  billData: any[],
  branchname: string,
  billId: string,
  billNo: string,
  date: string,
  time: string,
  totalBasic: string,
  grandTotal: string,
  taxableData: string,
  taxAmount: string,
  cgstGroups: Array<{cgst: string; amount: number}>,
  custName: string,
  custMobile: string,
  gstNumber: string,
  showTax: boolean,
  errorCallback: (err: any) => void,
  successCallback: (msg: any) => void,
): Promise<void> {
  try {
    const status = await NyxPrinter.getPrinterStatus();
    if (status !== PrinterStatus.SDK_OK) {
      errorCallback(PrinterStatus.msg(status));
      return;
    }

    const showSacCode = await isSacDisplayMode();
    const sacCode = showSacCode ? getMajorityHsnCode(billData) : '';
    const declarationLines = formatDeclarationLines(
      await getDeclarationDetails(),
    );

    // ----- Header -----
    if (showTax) {
      await NyxPrinter.printText('TAX INVOICE\n', {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
    }

    await NyxPrinter.printText(title ?? '', {
      textSize: 30,
      align: PrintAlign.CENTER,
    });

    const headerLines: string[] = [];
    if (orgname) headerLines.push(orgname + '\n');
    if (address1) headerLines.push(address1 + '\n');
    if (address2) headerLines.push(address2 + '\n');
    if (gstino) headerLines.push('GSTIN: ' + gstino);
    if (cin_no && cin_no !== '0') headerLines.push('CIN: ' + cin_no + '\n');
    /** Fixed 30-char name column; name wraps to next line(s) if longer; qty/rate/amount always on first line */
    const NAME_W = 30;
    const QTY_W = 6;
    const RATE_W = 8;
    const AMT_W = 8;
    const tableWeights = [30, 6, 8, 8];

    if (headerLines.length > 0) {
      await NyxPrinter.printText(headerLines.join(''), {
        textSize: 23,
        align: PrintAlign.CENTER,
      });
    }
    await NyxPrinter.printText(SEP, {
      textSize: 24,
      align: PrintAlign.CENTER,
    });
    await NyxPrinter.printText(
      'Date: ' + date + '    Time: ' + time + '\nBill No: ' + billNo,
      {
        textSize: 23,
        align: PrintAlign.CENTER,
      },
    );
    await NyxPrinter.printText(SEP, {
      textSize: 24,
      align: PrintAlign.CENTER,
    });
    await NyxPrinter.printTableText(
      ['Item Name', 'Qty', 'Rate', 'Amount'],
      tableWeights,
      [
        {textSize: 23, align: PrintAlign.LEFT},
        {textSize: 23, align: PrintAlign.RIGHT},
        {textSize: 23, align: PrintAlign.RIGHT},
        {textSize: 23, align: PrintAlign.RIGHT},
      ],
    );
    await NyxPrinter.printText(SEP, {
      textSize: 24,
      align: PrintAlign.CENTER,
    });

    // ----- Items: name 30 chars, wrap rest to next line; qty/rate/amount always on first line -----
    if (billData && billData.length > 0) {
      for (let i = 0; i < billData.length; i++) {
        const map = billData[i];
        if (!map) continue;

        const rawName = map.product_name ?? '';
        const name = toTitleCase(rawName);
        const hsn = map.hsn_code ?? '';
        const qty = getQuantityAsDouble(map);
        let rate = 0;
        try {
          const r = map.basic_rate;
          rate = typeof r === 'number' ? r : parseFloat(r) || 0;
        } catch (_) {}
        const amount = qty * rate;

        // Use table layout so printer fixes columns: qty/rate/amount always start at same place
        const nameFirstPart = name.slice(0, NAME_W);
        const weights = [30, 6, 8, 8];
        const cellStyles = [
          {textSize: 23, align: PrintAlign.LEFT},
          {textSize: 23, align: PrintAlign.RIGHT},
          {textSize: 23, align: PrintAlign.RIGHT},
          {textSize: 23, align: PrintAlign.RIGHT},
        ];
        await NyxPrinter.printTableText(
          [nameFirstPart, String(qty), formatMoney(rate), formatMoney(amount)],
          weights,
          cellStyles,
        );
        // Small gap between rows (pixels; ~8–12 ≈ ¼ line height)
        try {
          await NyxPrinter.paperOut(10);
        } catch (_) {}
        // If name > 30 chars, print remainder on next line(s)
        let remaining = name.slice(NAME_W);
        while (remaining.length > 0) {
          const wrapLine = remaining.slice(0, NAME_W) + '\n';
          await NyxPrinter.printText(wrapLine, {
            textSize: 22,
            align: PrintAlign.LEFT,
          });
          remaining = remaining.slice(NAME_W);
        }
        if (showTax && hsn && !showSacCode) {
          await NyxPrinter.printText('HSN: ' + hsn + '\n', {
            textSize: 20,
            align: PrintAlign.LEFT,
          });
        }
      }
    }

    // ----- Totals & Tax -----
    await NyxPrinter.printText(SEP, {
      textSize: 24,
      align: PrintAlign.CENTER,
    });
    if (showTax) {
      const taxBlock =
        'Tot Basic : ' +
        totalBasic +
        '\n' +
        'Taxable   : ' +
        taxableData +
        '\n' +
        'Tax       : ' +
        taxAmount;
      await NyxPrinter.printText(taxBlock, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
      if (cgstGroups && cgstGroups.length > 0) {
        let cgstLines = '';
        for (let i = 0; i < cgstGroups.length; i++) {
          const m = cgstGroups[i];
          if (!m || m.amount <= 0) continue;
          const cg = m.cgst ?? '0';
          const amtStr = formatMoney(m.amount);
          cgstLines += 'CGST ' + cg + '% : ' + amtStr + '\n';
          cgstLines += 'SGST ' + cg + '% : ' + amtStr + '\n';
        }
        if (cgstLines) {
          await NyxPrinter.printText(cgstLines, {
            textSize: 22,
            align: PrintAlign.CENTER,
          });
        }
      }
      await NyxPrinter.printText(SEP, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
    }

    // ----- Grand Total -----
    if (showTax && showSacCode && sacCode) {
      await NyxPrinter.printText('SAC Code: ' + sacCode, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
      await NyxPrinter.printText(SEP, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
    }
    await NyxPrinter.printText('Grand Total: ' + grandTotal, {
      textSize: 30,
      align: PrintAlign.CENTER,
    });

    // ----- Customer -----
    if (custName) {
      await NyxPrinter.printText('Customer Name : ' + custName, {
        textSize: 22,
        align: PrintAlign.CENTER,
      });
    }
    if (custMobile) {
      await NyxPrinter.printText('Customer Ph   : ' + custMobile, {
        textSize: 22,
        align: PrintAlign.CENTER,
      });
    }
    if (gstNumber) {
      await NyxPrinter.printText('Customer GST  : ' + gstNumber, {
        textSize: 22,
        align: PrintAlign.CENTER,
      });
    }

    // ----- Footer -----
    await NyxPrinter.printText(SEP, {
      textSize: 24,
      align: PrintAlign.CENTER,
    });
    for (const line of declarationLines) {
      await NyxPrinter.printText(line, {
        textSize: 22,
        align: PrintAlign.CENTER,
      });
    }
    await NyxPrinter.printText('Thank You\n', {
      textSize: 22,
      align: PrintAlign.CENTER,
    });

    // Feed and cut (Nyx equivalent of printAndFeedPaper + cut)
    await NyxPrinter.printEndAutoOut();

    successCallback('Printed');
  } catch (e: any) {
    errorCallback(e?.message ?? String(e));
  }
}

/**
 * Prints KOT (token) ticket – same layout as NGXBillingModule.onCounterBillGenerateWithToken.
 * One ticket per group in groupedItems JSON; cuts after each group.
 */
export async function onCounterBillGenerateWithToken(
  _title: string,
  _orgname: string,
  _gstino: string,
  _address1: string,
  _address2: string,
  _cin_no: string,
  _billData: any[],
  _branchname: string,
  _billId: string,
  billNo: string,
  date: string,
  time: string,
  _totalBasic: string,
  _grandTotal: string,
  _taxableData: string,
  _taxAmount: string,
  _cgstGroups: Array<{cgst: string; amount: number}>,
  groupedItems: string,
  token: number | null,
  _custName: string,
  _custMobile: string,
  _gstNumber: string,
  _showTax: boolean,
  errorCallback: (err: any) => void,
  successCallback: (msg: any) => void,
): Promise<void> {
  try {
    const status = await NyxPrinter.getPrinterStatus();
    if (status !== PrinterStatus.SDK_OK) {
      errorCallback(PrinterStatus.msg(status));
      return;
    }

    const groups = parseGroupedItems(groupedItems);
    const groupKeys = Object.keys(groups);

    if (groupKeys.length === 0) {
      errorCallback('No token items to print');
      return;
    }

    const NAME_W = 30;
    const kotTableWeights = [30, 6];
    const kotHeaderStyles = [
      {textSize: 23, align: PrintAlign.LEFT},
      {textSize: 23, align: PrintAlign.RIGHT},
    ];
    const kotRowStyles = [
      {textSize: 23, align: PrintAlign.LEFT},
      {textSize: 23, align: PrintAlign.RIGHT},
    ];

    for (const groupKey of groupKeys) {
      const items = groups[groupKey];
      if (!items || items.length === 0) continue;

      await NyxPrinter.printText('TOKEN: ' + (token ?? '') + '\n', {
        textSize: 30,
        align: PrintAlign.CENTER,
      });

      await NyxPrinter.printText(SEP, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });
      await NyxPrinter.printText(
        'Date: ' + date + '    Time: ' + time + '\nBill No: ' + billNo,
        {
          textSize: 23,
          align: PrintAlign.CENTER,
        },
      );
      await NyxPrinter.printText(SEP, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });

      await NyxPrinter.printTableText(
        ['Item Name', 'Qty'],
        kotTableWeights,
        kotHeaderStyles,
      );
      await NyxPrinter.printText(SEP, {
        textSize: 24,
        align: PrintAlign.CENTER,
      });

      for (const item of items) {
        if (!item) continue;
        const name = toTitleCase(String(item.product_name ?? ''));
        const qty = getQuantityAsDouble(item);
        const nameFirstPart = name.slice(0, NAME_W);

        await NyxPrinter.printTableText(
          [nameFirstPart, String(qty)],
          kotTableWeights,
          kotRowStyles,
        );
        try {
          await NyxPrinter.paperOut(10);
        } catch (_) {}

        let remaining = name.slice(NAME_W);
        while (remaining.length > 0) {
          await NyxPrinter.printText(remaining.slice(0, NAME_W) + '\n', {
            textSize: 22,
            align: PrintAlign.LEFT,
          });
          remaining = remaining.slice(NAME_W);
        }
      }

      try {
        await NyxPrinter.paperOut(30);
      } catch (_) {}

      await NyxPrinter.printEndAutoOut();
    }

    successCallback('Printed');
  } catch (e: any) {
    errorCallback(e?.message ?? String(e));
  }
}

/**
 * Object compatible with Dashboard's printerDetails when printer is NYX.
 * Use: setPrinterDetails(nyxPrinterDetails) when getPrinterDetails() returns name === 'NYX'.
 */
export const nyxPrinterDetails = {
  onCounterBillGenerate,
  onCounterBillGenerateWithToken,
};
