import { useRef, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
    ArrowLeft, Printer, Pencil, Check, Plus, Trash2,
    CalendarDays, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useJobsContext } from '../contexts/JobsContext';
import { DOCUMENT_LABELS } from '../hooks/useJobs';
import type { DocumentType, JobForm } from '../hooks/useJobs';
import { DocumentTemplate } from '../components/DocumentPanel';

/* ─── Types ─── */

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

/* ─── Constants ─── */

const DEFAULT_VAT_RATE = 7;
const DOC_TABS: DocumentType[] = ['quotation', 'invoice', 'tax-invoice', 'receipt', 'handover'];
const EDITABLE_DOCS: DocumentType[] = ['quotation', 'invoice', 'receipt'];

/* ─── Helpers ─── */

function defaultOverrides(job: JobForm): DocOverrides {
    return {
        lineItems: [{ description: job.name, qty: 1, unit: 'งาน', unitPrice: job.amount ?? 5000 }],
        notes: '',
        validUntil: '',
        dueDate: '',
        paymentMethod: 'เงินสด',
    };
}

function calcTotals(items: LineItem[], rate: number) {
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const tax = Math.round(subtotal * rate) / 100;
    return { subtotal, tax, total: subtotal + tax };
}

/* ─── Edit Panel ─── */

function EditPanel({
    overrides,
    docType,
    taxRate,
    onChange,
}: {
    overrides: DocOverrides;
    docType: DocumentType;
    taxRate: number;
    onChange: (v: DocOverrides) => void;
}) {
    const update = (patch: Partial<DocOverrides>) => onChange({ ...overrides, ...patch });
    const addItem = () => update({ lineItems: [...overrides.lineItems, { description: '', qty: 1, unit: 'งาน', unitPrice: 0 }] });
    const removeItem = (idx: number) => update({ lineItems: overrides.lineItems.filter((_, i) => i !== idx) });
    const updateItem = (idx: number, patch: Partial<LineItem>) =>
        update({ lineItems: overrides.lineItems.map((it, i) => i === idx ? { ...it, ...patch } : it) });

    const { subtotal, tax, total } = useMemo(
        () => calcTotals(overrides.lineItems, taxRate),
        [overrides.lineItems, taxRate]
    );

    const noSpinner = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

    return (
        <div className="p-5 space-y-6 text-sm">
            {/* Line Items */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-700">รายการสินค้า/บริการ</p>
                    <button type="button" onClick={addItem}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus-visible:underline"
                    >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> เพิ่มรายการ
                    </button>
                </div>

                <div className="space-y-3">
                    {overrides.lineItems.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-5 shrink-0 text-center font-mono">{idx + 1}</span>
                                <Input
                                    className="flex-1 bg-white"
                                    placeholder="ชื่อรายการ/บริการ"
                                    value={item.description}
                                    onChange={e => updateItem(idx, { description: e.target.value })}
                                />
                                <button type="button" onClick={() => removeItem(idx)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                                    aria-label="ลบรายการ"
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3 pl-7">
                                {(['จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม'] as const).map((lbl, fi) => (
                                    <div key={fi} className="space-y-1">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wide">{lbl}</label>
                                        {fi === 0 && (
                                            <Input type="number" inputMode="numeric" className={`h-9 bg-white ${noSpinner}`}
                                                placeholder="1"
                                                value={item.qty > 0 ? item.qty : ''}
                                                onChange={e => updateItem(idx, { qty: Number(e.target.value) })} />
                                        )}
                                        {fi === 1 && (
                                            <Input className="h-9 bg-white" placeholder="งาน"
                                                value={item.unit}
                                                onChange={e => updateItem(idx, { unit: e.target.value })} />
                                        )}
                                        {fi === 2 && (
                                            <Input type="number" inputMode="numeric" className={`h-9 bg-white ${noSpinner}`}
                                                placeholder="0.00"
                                                value={item.unitPrice > 0 ? item.unitPrice : ''}
                                                onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })} />
                                        )}
                                        {fi === 3 && (
                                            <div className="h-9 flex items-center text-sm font-semibold text-blue-700">
                                                {(item.qty * item.unitPrice).toLocaleString()} ฿
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 border-t pt-3 space-y-1 text-right text-sm text-gray-600">
                    <p>ยอดรวม: <span className="font-medium">{subtotal.toLocaleString()} ฿</span></p>
                    {taxRate > 0 && <p>VAT {taxRate}%: <span className="font-medium">{tax.toLocaleString()} ฿</span></p>}
                    <p className="text-base font-bold text-blue-700">รวมทั้งสิ้น: {total.toLocaleString()} ฿</p>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Doc-specific fields */}
            {docType === 'quotation' && (
                <div className="space-y-2">
                    <label htmlFor="pv-valid-until" className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        วันหมดอายุใบเสนอราคา
                    </label>
                    <Input id="pv-valid-until" type="date" className="text-sm"
                        value={overrides.validUntil}
                        onChange={e => update({ validUntil: e.target.value })} />
                </div>
            )}
            {docType === 'invoice' && (
                <div className="space-y-2">
                    <label htmlFor="pv-due-date" className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        วันครบกำหนดชำระ
                    </label>
                    <Input id="pv-due-date" type="date" className="text-sm"
                        value={overrides.dueDate}
                        onChange={e => update({ dueDate: e.target.value })} />
                </div>
            )}
            {docType === 'receipt' && (
                <div className="space-y-2">
                    <label htmlFor="pv-payment" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">วิธีชำระเงิน</label>
                    <select id="pv-payment"
                        className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
                <label htmlFor="pv-notes" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">หมายเหตุ</label>
                <textarea id="pv-notes" rows={3}
                    placeholder="หมายเหตุเพิ่มเติม…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 resize-none"
                    value={overrides.notes}
                    onChange={e => update({ notes: e.target.value })}
                />
            </div>
        </div>
    );
}

/* ─── Main Page ─── */

export default function DocumentPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getJobById } = useJobsContext();
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef });

    const job = getJobById(jobId ?? '');

    const initialDocParam = (searchParams.get('doc') ?? 'quotation') as DocumentType;
    const [activeDoc, setActiveDoc] = useState<DocumentType>(
        DOC_TABS.includes(initialDocParam) ? initialDocParam : 'quotation'
    );
    const [isEditing, setIsEditing] = useState(false);
    const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
    const [overridesMap, setOverridesMap] = useState<Record<DocumentType, DocOverrides>>(() => {
        const base = job ? defaultOverrides(job) : defaultOverrides({ id: '', name: '', jobType: '', customerName: '', customerAddress: '', customerPhone: '', description: '', createdAt: new Date().toISOString().split('T')[0] });
        return { quotation: base, invoice: base, 'tax-invoice': base, receipt: base, handover: base };
    });

    const overrides = overridesMap[activeDoc];
    const setOverrides = (v: DocOverrides) => setOverridesMap(prev => ({ ...prev, [activeDoc]: v }));
    const canEdit = EDITABLE_DOCS.includes(activeDoc);

    // Job not found
    if (!job) {
        return (
            <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>
                <div>
                    <p className="font-semibold text-gray-700">ไม่พบใบงาน</p>
                    <p className="text-sm text-gray-400 mt-1">ใบงาน {jobId} อาจถูกลบหรือไม่มีในระบบ</p>
                </div>
                <Button onClick={() => navigate('/admin/jobs')} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> กลับหน้าใบงาน
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6">
            {/* Page Header */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate('/admin/jobs')}
                        className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label="กลับหน้าใบงาน"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">{job.id}</span>
                            <span className="font-semibold text-gray-900 text-sm truncate">{job.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{job.customerName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {canEdit && (
                        <Button
                            type="button"
                            size="sm"
                            variant={isEditing ? 'default' : 'outline'}
                            onClick={() => setIsEditing(e => !e)}
                            className="gap-1.5"
                        >
                            {isEditing
                                ? <><Check className="w-3.5 h-3.5" aria-hidden="true" /> เสร็จสิ้น</>
                                : <><Pencil className="w-3.5 h-3.5" aria-hidden="true" /> แก้ไข</>
                            }
                        </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => handlePrint()}>
                        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </Button>
                </div>
            </div>

            {/* Doc type tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 bg-white shrink-0 px-4 lg:px-6 gap-1" role="tablist">
                {DOC_TABS.map(doc => (
                    <button
                        key={doc}
                        role="tab"
                        aria-selected={activeDoc === doc}
                        type="button"
                        onClick={() => { setActiveDoc(doc); setIsEditing(false); }}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                            activeDoc === doc
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {DOCUMENT_LABELS[doc]}
                        {EDITABLE_DOCS.includes(doc) && <span className="text-[10px] opacity-50">✏️</span>}
                    </button>
                ))}
            </div>

            {/* Body */}
            {isEditing && canEdit ? (
                <>
                    {/* Mobile tab bar */}
                    <div className="flex lg:hidden border-b border-gray-100 shrink-0 bg-white" role="tablist">
                        {(['edit', 'preview'] as const).map(tab => (
                            <button
                                key={tab}
                                role="tab"
                                aria-selected={mobileTab === tab}
                                onClick={() => setMobileTab(tab)}
                                className={cn(
                                    'flex-1 py-2.5 text-sm font-medium transition-colors',
                                    mobileTab === tab
                                        ? 'border-b-2 border-blue-600 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                {tab === 'edit' ? '✏️ แก้ไข' : '👁️ ตัวอย่าง'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden flex min-h-0">
                        {/* Edit panel */}
                        <div className={cn(
                            'overflow-y-auto border-r border-gray-100 bg-white',
                            mobileTab === 'edit' ? 'flex-1 lg:flex-none' : 'hidden lg:block',
                            'lg:w-[400px] xl:w-[460px]'
                        )}>
                            <div className="p-3 bg-blue-50 border-b border-blue-100">
                                <p className="text-xs font-semibold text-blue-700">✏️ แก้ไข: {DOCUMENT_LABELS[activeDoc]}</p>
                            </div>
                            <EditPanel
                                overrides={overrides}
                                docType={activeDoc}
                                taxRate={job.taxRate ?? DEFAULT_VAT_RATE}
                                onChange={setOverrides}
                            />
                        </div>

                        {/* Preview */}
                        <div className={cn(
                            'overflow-y-auto bg-gray-50 p-6',
                            mobileTab === 'preview' ? 'flex-1' : 'hidden lg:flex lg:flex-1'
                        )}>
                            <div className="max-w-3xl mx-auto bg-white rounded-sm overflow-hidden" ref={printRef}>
                                <DocumentTemplate job={job} docType={activeDoc} overrides={overrides} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // Preview only
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="max-w-3xl mx-auto bg-white rounded-sm overflow-hidden" ref={printRef}>
                        <DocumentTemplate job={job} docType={activeDoc} overrides={overrides} />
                    </div>
                </div>
            )}
        </div>
    );
}
