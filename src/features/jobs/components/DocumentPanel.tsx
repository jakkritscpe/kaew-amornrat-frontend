import { useRef, useState, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { JobForm, DocumentType } from '../hooks/useJobs';
import { DOCUMENT_LABELS } from '../hooks/useJobs';
import { X, Printer, FileText, Pencil, Check, Plus, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_VAT_RATE = 7;

/* ─────────────────── Types ─────────────────── */

interface LineItem {
    description: string;
    qty: number;
    unit: string;
    unitPrice: number;
}

interface DocOverrides {
    lineItems: LineItem[];
    notes: string;
    validUntil: string;
    dueDate: string;
    paymentMethod: string;
}

/* ─────────────────── Constants ─────────────── */

const DOC_TABS: DocumentType[] = ['quotation', 'invoice', 'tax-invoice', 'receipt', 'handover'];
const EDITABLE_DOCS: DocumentType[] = ['quotation', 'invoice', 'receipt'];

/* ─────────────────── Helpers ─────────────── */

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function defaultOverrides(job: JobForm): DocOverrides {
    return {
        lineItems: [
            {
                description: job.name,
                qty: 1,
                unit: 'งาน',
                unitPrice: job.amount ?? 5000,
            },
        ],
        notes: '',
        validUntil: '',
        dueDate: '',
        paymentMethod: 'เงินสด',
    };
}

function calcTotals(items: LineItem[], taxRate: number) {
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const tax = (subtotal * taxRate) / 100;
    return { subtotal, tax, total: subtotal + tax };
}

/* ─────────────────── Edit Panel ─────────────── */

interface EditPanelProps {
    overrides: DocOverrides;
    docType: DocumentType;
    taxRate: number;
    onChange: (v: DocOverrides) => void;
}

function EditPanel({ overrides, docType, taxRate, onChange }: EditPanelProps) {
    const update = (patch: Partial<DocOverrides>) => onChange({ ...overrides, ...patch });

    const updateItem = (idx: number, patch: Partial<LineItem>) => {
        const items = overrides.lineItems.map((it, i) => i === idx ? { ...it, ...patch } : it);
        update({ lineItems: items });
    };

    const addItem = () => update({
        lineItems: [...overrides.lineItems, { description: '', qty: 1, unit: 'งาน', unitPrice: 0 }],
    });

    const removeItem = (idx: number) =>
        update({ lineItems: overrides.lineItems.filter((_, i) => i !== idx) });

    const { subtotal, tax, total } = useMemo(
        () => calcTotals(overrides.lineItems, taxRate),
        [overrides.lineItems, taxRate]
    );

    return (
        <div className="p-4 space-y-5 text-sm">
            {/* Line Items */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">รายการสินค้า/บริการ</p>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus-visible:underline"
                    >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> เพิ่มรายการ
                    </button>
                </div>

                <div className="space-y-3">
                    {overrides.lineItems.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                            {/* Description */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-5 shrink-0 text-center">{idx + 1}</span>
                                <Input
                                    className="flex-1 text-sm bg-white"
                                    placeholder="ชื่อรายการ/บริการ"
                                    value={item.description}
                                    onChange={e => updateItem(idx, { description: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    aria-label="ลบรายการ"
                                >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            </div>
                            {/* Qty / Unit / Price */}
                            <div className="flex gap-2 pl-7">
                                <div className="flex-1 space-y-0.5">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide">จำนวน</label>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        className="text-sm h-8 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="1"
                                        value={item.qty > 0 ? item.qty : ''}
                                        onChange={e => updateItem(idx, { qty: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide">หน่วย</label>
                                    <Input
                                        className="text-sm h-8 bg-white"
                                        placeholder="งาน"
                                        value={item.unit}
                                        onChange={e => updateItem(idx, { unit: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide">ราคา/หน่วย</label>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        className="text-sm h-8 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.00"
                                        value={item.unitPrice > 0 ? item.unitPrice : ''}
                                        onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide">รวม</label>
                                    <div className="h-8 flex items-center text-sm font-medium text-gray-700">
                                        {(item.qty * item.unitPrice).toLocaleString()} ฿
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals summary */}
                <div className="mt-3 border-t pt-2 space-y-1 text-xs text-right text-gray-600">
                    <p>ยอดรวม: <span className="font-medium">{subtotal.toLocaleString()} ฿</span></p>
                    {taxRate > 0 && <p>VAT {taxRate}%: <span className="font-medium">{tax.toLocaleString()} ฿</span></p>}
                    <p className="text-sm font-bold text-blue-700">รวมทั้งสิ้น: {total.toLocaleString()} ฿</p>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Doc-specific fields */}
            {docType === 'quotation' && (
                <div className="space-y-1.5">
                    <label htmlFor="doc-valid-until" className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        วันหมดอายุใบเสนอราคา
                    </label>
                    <Input
                        id="doc-valid-until"
                        type="date"
                        value={overrides.validUntil}
                        onChange={e => update({ validUntil: e.target.value })}
                        className="text-sm"
                    />
                </div>
            )}
            {docType === 'invoice' && (
                <div className="space-y-1.5">
                    <label htmlFor="doc-due-date" className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        วันครบกำหนดชำระ
                    </label>
                    <Input
                        id="doc-due-date"
                        type="date"
                        value={overrides.dueDate}
                        onChange={e => update({ dueDate: e.target.value })}
                        className="text-sm"
                    />
                </div>
            )}
            {docType === 'receipt' && (
                <div className="space-y-2">
                    <label htmlFor="doc-payment" className="text-xs font-semibold text-gray-500 uppercase">วิธีชำระเงิน</label>
                    <select
                        id="doc-payment"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus-visible:ring-2 focus-visible:ring-blue-400 focus:outline-none"
                        value={overrides.paymentMethod}
                        onChange={e => update({ paymentMethod: e.target.value })}
                    >
                        <option>เงินสด</option>
                        <option>โอนเงินธนาคาร</option>
                        <option>บัตรเครดิต/เดบิต</option>
                    </select>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <label htmlFor="doc-notes" className="text-xs font-semibold text-gray-500 uppercase">หมายเหตุ</label>
                <textarea
                    id="doc-notes"
                    rows={3}
                    value={overrides.notes}
                    onChange={e => update({ notes: e.target.value })}
                    placeholder="หมายเหตุเพิ่มเติม…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                />
            </div>
        </div>
    );
}

/* ─────────────────── Document Template ─────────────── */

interface TemplateProps {
    job: JobForm;
    docType: DocumentType;
    overrides: DocOverrides;
}

function DocumentHeader({ title, job, docNumber }: { title: string; job: JobForm; docNumber: string }) {
    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">เลขที่: {docNumber}</p>
                <p className="text-sm text-gray-500">วันที่: {formatDate(job.createdAt)}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-[#00223A]">หจก.แก้วอมรรัตน์</p>
                <p className="text-sm text-gray-500">บริการไอทีครบวงจร มืออาชีพ มาถึงที่</p>
                <p className="text-sm text-gray-500">พื้นที่ให้บริการ: กรุงเทพมหานคร และปริมณฑล</p>
                <p className="text-sm text-gray-500">บริการ 24 ชั่วโมง</p>
            </div>
        </div>
    );
}

function CustomerInfo({ job }: { job: JobForm }) {
    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">ข้อมูลลูกค้า / Customer</p>
            <p className="font-semibold text-gray-800">{job.customerName || '—'}</p>
            {job.customerAddress && <p className="text-sm text-gray-600">{job.customerAddress}</p>}
            {job.customerPhone && <p className="text-sm text-gray-600">โทร: {job.customerPhone}</p>}
        </div>
    );
}

function LineItemTable({ overrides, taxRate }: { overrides: DocOverrides; taxRate: number }) {
    const { subtotal, tax, total } = calcTotals(overrides.lineItems, taxRate);

    return (
        <table className="w-full border-collapse text-sm mb-4 table-fixed">
            <thead>
                <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-2.5 text-center w-[5%] whitespace-nowrap">#</th>
                    <th className="px-4 py-2.5 text-left w-[40%]">รายการ</th>
                    <th className="px-4 py-2.5 text-center w-[12%] whitespace-nowrap">จำนวน</th>
                    <th className="px-4 py-2.5 text-center w-[13%] whitespace-nowrap">หน่วย</th>
                    <th className="px-4 py-2.5 text-right w-[15%] whitespace-nowrap">ราคา/หน่วย</th>
                    <th className="px-4 py-2.5 text-right w-[15%] whitespace-nowrap">รวม</th>
                </tr>
            </thead>
            <tbody>
                {overrides.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 align-top hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-800 break-words">{item.description}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.qty}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{(item.qty * item.unitPrice).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500">ยอดรวม:</td>
                    <td className="px-4 py-1.5 text-right">{subtotal.toLocaleString()} ฿</td>
                </tr>
                {taxRate > 0 && (
                    <tr>
                        <td colSpan={5} className="px-4 py-1.5 text-right text-gray-500">ภาษีมูลค่าเพิ่ม ({taxRate}%):</td>
                        <td className="px-4 py-1.5 text-right">{tax.toLocaleString()} ฿</td>
                    </tr>
                )}
                <tr className="font-bold bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-right">รวมทั้งสิ้น:</td>
                    <td className="px-4 py-2 text-right text-blue-700">{total.toLocaleString()} ฿</td>
                </tr>
            </tfoot>
        </table>
    );
}

export function DocumentTemplate({ job, docType, overrides }: TemplateProps) {
    const title = DOCUMENT_LABELS[docType];
    const docNumber = `${job.id}-${docType.toUpperCase().slice(0, 3)}`;
    const taxRate = docType === 'tax-invoice' ? (job.taxRate ?? DEFAULT_VAT_RATE) : 0;

    return (
        <div className="font-sans text-gray-800 p-8 bg-white min-h-[800px] print:p-12">
            <DocumentHeader title={title} job={job} docNumber={docNumber} />
            <CustomerInfo job={job} />

            {docType === 'handover' ? (
                <div className="mb-6">
                    <p className="font-semibold text-gray-700 mb-2">รายละเอียดงานที่ส่งมอบ:</p>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 min-h-[160px]">
                        <p><strong>ชื่องาน:</strong> {job.name}</p>
                        <p><strong>ประเภทงาน:</strong> {job.jobType}</p>
                        <p><strong>รายละเอียด:</strong> {job.description}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                        <span>✅ งานเสร็จสมบูรณ์และส่งมอบเรียบร้อย</span>
                    </div>
                </div>
            ) : (
                <>
                    <LineItemTable overrides={overrides} taxRate={docType === 'tax-invoice' ? taxRate : 0} />

                    {/* Doc-specific extra info */}
                    {docType === 'quotation' && overrides.validUntil && (
                        <p className="text-sm text-gray-500 mb-2">ใบเสนอราคานี้มีผลถึง: <strong>{formatDate(overrides.validUntil)}</strong></p>
                    )}
                    {docType === 'invoice' && overrides.dueDate && (
                        <p className="text-sm text-gray-500 mb-2">กรุณาชำระภายใน: <strong>{formatDate(overrides.dueDate)}</strong></p>
                    )}
                    {docType === 'receipt' && (
                        <p className="text-sm text-gray-500 mb-2">ชำระโดย: <strong>{overrides.paymentMethod}</strong></p>
                    )}
                </>
            )}

            {overrides.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-gray-600">
                    <p className="font-semibold text-gray-700 mb-1">หมายเหตุ:</p>
                    <p>{overrides.notes}</p>
                </div>
            )}

            <div className="mt-10 flex justify-between text-sm text-gray-500">
                <div className="text-center">
                    <div className="border-t border-gray-400 w-40 mx-auto mb-1 mt-8" />
                    <p>ผู้จัดทำ</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-gray-400 w-40 mx-auto mb-1 mt-8" />
                    <p>ผู้อนุมัติ / {title}</p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────── Main Panel ─────────────── */

interface DocumentPanelProps {
    job: JobForm;
    activeDoc: DocumentType;
    onChangeDoc: (doc: DocumentType) => void;
    onClose: () => void;
}

export default function DocumentPanel({ job, activeDoc, onChangeDoc, onClose }: DocumentPanelProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @media print {
                * {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    border: none !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
    const [overridesMap, setOverridesMap] = useState<Record<DocumentType, DocOverrides>>({
        quotation: defaultOverrides(job),
        invoice: defaultOverrides(job),
        'tax-invoice': defaultOverrides(job),
        receipt: defaultOverrides(job),
        handover: defaultOverrides(job),
    });

    const overrides = overridesMap[activeDoc];
    const setOverrides = (v: DocOverrides) => setOverridesMap(prev => ({ ...prev, [activeDoc]: v }));
    const canEdit = EDITABLE_DOCS.includes(activeDoc);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end" role="dialog" aria-modal="true" aria-label={`เอกสาร ${job.id}`}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                style={{ width: isEditing ? '100vw' : 'min(680px, 100vw)', overscrollBehavior: 'contain' }}
            >
                {/* Panel Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center" aria-hidden="true">
                            <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{job.id} — {job.name}</p>
                            <p className="text-xs text-gray-500">{job.customerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button
                                size="sm"
                                variant={isEditing ? 'default' : 'outline'}
                                className={cn('gap-1.5', isEditing && 'bg-emerald-600 hover:bg-emerald-700')}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                {isEditing ? 'เสร็จสิ้น' : 'แก้ไข'}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handlePrint()}
                        >
                            <Printer className="w-4 h-4" />
                            Export PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label="ปิด"
                        >
                            <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Doc Type Tabs */}
                <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50 overflow-x-auto shrink-0">
                    {DOC_TABS.map(doc => (
                        <button
                            key={doc}
                            onClick={() => { onChangeDoc(doc); setIsEditing(false); }}
                            className={cn(
                                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                activeDoc === doc
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            {DOCUMENT_LABELS[doc]}
                            {EDITABLE_DOCS.includes(doc) && (
                                <span className="ml-1 text-[10px] opacity-60">✏️</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body: tab-based on mobile, split view on lg+ */}
                {isEditing && canEdit ? (
                    <>
                        {/* Mobile: Tab bar (Edit | Preview) */}
                        <div className="flex lg:hidden border-b border-gray-100 shrink-0" role="tablist">
                            <button
                                role="tab"
                                aria-selected={mobileTab === 'edit'}
                                onClick={() => setMobileTab('edit')}
                                className={cn(
                                    'flex-1 py-2.5 text-sm font-medium transition-colors',
                                    mobileTab === 'edit'
                                        ? 'border-b-2 border-blue-600 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                ✏️ แก้ไข
                            </button>
                            <button
                                role="tab"
                                aria-selected={mobileTab === 'preview'}
                                onClick={() => setMobileTab('preview')}
                                className={cn(
                                    'flex-1 py-2.5 text-sm font-medium transition-colors',
                                    mobileTab === 'preview'
                                        ? 'border-b-2 border-blue-600 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                👁️ ตัวอย่าง
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Edit panel — full on mobile tab, fixed width on desktop */}
                            <div className={cn(
                                'overflow-y-auto border-r border-gray-100 bg-white',
                                // Mobile: show only when edit tab active
                                mobileTab === 'edit' ? 'flex-1 lg:flex-none' : 'hidden lg:block',
                                'lg:w-96'
                            )}>
                                <div className="p-3 border-b border-gray-100 bg-blue-50">
                                    <p className="text-xs font-semibold text-blue-700">✏️ แก้ไข: {DOCUMENT_LABELS[activeDoc]}</p>
                                </div>
                                <EditPanel
                                    overrides={overrides}
                                    docType={activeDoc}
                                    taxRate={job.taxRate ?? DEFAULT_VAT_RATE}
                                    onChange={setOverrides}
                                />
                            </div>

                            {/* Preview — hidden on mobile when edit tab active */}
                            <div className={cn(
                                'overflow-y-auto bg-gray-100 p-4',
                                mobileTab === 'preview' ? 'flex-1' : 'hidden lg:flex lg:flex-1'
                            )}>
                                <div className="bg-white rounded-xl shadow-md overflow-hidden" ref={printRef}>
                                    <DocumentTemplate job={job} docType={activeDoc} overrides={overrides} />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // Non-editing: just preview full-width
                    <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                        <div className="bg-white rounded-xl shadow-md overflow-hidden" ref={printRef}>
                            <DocumentTemplate job={job} docType={activeDoc} overrides={overrides} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
