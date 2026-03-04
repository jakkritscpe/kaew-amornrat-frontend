import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Building2, Phone, MapPin, Type, AlignLeft, ChevronDown, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useJobsContext } from '../contexts/JobsContext';
import { JOB_TYPES, DOCUMENT_LABELS } from '../hooks/useJobs';
import type { JobForm, DocumentType } from '../hooks/useJobs';

/* ─── Constants ─── */

const EMPTY_FORM: Omit<JobForm, 'id' | 'createdAt'> = {
    name: '',
    jobType: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    description: '',
    amount: 0,
    taxRate: 7,
    images: [],
};

const DOC_TYPES: DocumentType[] = ['quotation', 'invoice', 'tax-invoice', 'receipt', 'handover'];

const BADGE_COLORS: Record<DocumentType, string> = {
    quotation: 'bg-blue-100 text-blue-700',
    invoice: 'bg-amber-100 text-amber-700',
    'tax-invoice': 'bg-violet-100 text-violet-700',
    receipt: 'bg-emerald-100 text-emerald-700',
    handover: 'bg-gray-100 text-gray-700',
};

/* ─── Sub-components: Small, Single-Responsibility ─── */

interface FormFieldProps {
    label: string;
    htmlFor: string;
    icon: React.ElementType;
    children: React.ReactNode;
    required?: boolean;
}

function FormField({ label, htmlFor, icon: Icon, children, required }: FormFieldProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Icon className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                {label}
                {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
                {required && <span className="sr-only">(จำเป็น)</span>}
            </label>
            {children}
        </div>
    );
}

function DocumentTypeBadge({ docType }: { docType: DocumentType }) {
    return (
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', BADGE_COLORS[docType])}>
            {DOCUMENT_LABELS[docType]}
        </span>
    );
}

function EmptyJobsState() {
    return (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div
                className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3"
                aria-hidden="true"
            >
                <FileText className="w-6 h-6 text-blue-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-gray-500">ยังไม่มีใบงาน</p>
            <p className="text-xs text-gray-400 mt-1">สร้างใบงานแรกจากฟอร์มด้านซ้ายได้เลย</p>
        </div>
    );
}

interface JobRowProps {
    job: JobForm;
    onOpenDoc: (job: JobForm, doc: DocumentType) => void;
}

function JobRow({ job, onOpenDoc }: JobRowProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <button
                type="button"
                className="flex items-center justify-between p-4 w-full text-left focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 rounded-xl"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0" aria-hidden="true">
                        <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">{job.id}</span>
                            <span className="text-sm font-semibold text-gray-800">{job.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">{job.customerName}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                            <span className="text-xs text-gray-500">{job.jobType}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 hidden md:block">
                        {new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(job.createdAt))}
                    </span>
                    <ChevronDown
                        className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
                        aria-hidden="true"
                    />
                </div>
            </button>

            {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-50">
                    <p className="text-xs text-gray-500 mt-3 mb-3">เลือกประเภทเอกสารที่ต้องการสร้าง:</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="ประเภทเอกสาร">
                        {DOC_TYPES.map(doc => (
                            <button
                                key={doc}
                                type="button"
                                onClick={() => onOpenDoc(job, doc)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                            >
                                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                {DOCUMENT_LABELS[doc]}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Form validation ─── */

type FormErrors = Partial<typeof EMPTY_FORM>;

function validateJobForm(form: typeof EMPTY_FORM): FormErrors {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'กรุณากรอกชื่องาน';
    if (!form.jobType) errors.jobType = 'กรุณาเลือกประเภทงาน';
    if (!form.customerName.trim()) errors.customerName = 'กรุณากรอกชื่อลูกค้า';
    return errors;
}

/* ─── Main Page ─── */

export default function JobsPage() {
    const { jobs, addJob } = useJobsContext();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateJobForm(form);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        const newJob = addJob(form);
        setForm(EMPTY_FORM);
        setErrors({});
        // Navigate directly to the document page after creating the job
        navigate(`/admin/jobs/${newJob.id}/document?doc=quotation`);
    }, [form, addJob, navigate]);

    const handleOpenDoc = useCallback((job: JobForm, doc: DocumentType) => {
        navigate(`/admin/jobs/${job.id}/document?doc=${doc}`);
    }, [navigate]);

    const handleClearForm = useCallback(() => {
        setForm(EMPTY_FORM);
        setErrors({});
    }, []);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ระบบงานซ่อม</h1>
                <p className="text-sm text-gray-500 mt-1">สร้างใบงานซ่อมและออกเอกสารอัตโนมัติ</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                {/* LEFT: Job Form */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center" aria-hidden="true">
                                <Plus className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">สร้างใบงานใหม่</h2>
                                <p className="text-xs text-gray-500">Job Form</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {/* Auto ID */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400" aria-label="รหัสงาน">
                                <span className="font-mono text-xs font-semibold text-blue-400">ID:</span>
                                <span>สร้างอัตโนมัติ (Auto Generate)</span>
                            </div>

                            <FormField htmlFor="job-name" label="ชื่องาน (Name)" icon={AlignLeft} required>
                                <Input
                                    id="job-name"
                                    name="name"
                                    autoComplete="off"
                                    placeholder="เช่น ซ่อมแอร์ห้อง 101…"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className={cn(errors.name && 'border-red-400 focus-visible:ring-red-400')}
                                    aria-invalid={!!errors.name}
                                    aria-describedby={errors.name ? 'name-error' : undefined}
                                />
                                {errors.name && <p id="name-error" className="text-xs text-red-500" role="alert">{errors.name}</p>}
                            </FormField>

                            <FormField htmlFor="job-type" label="ประเภทงาน (Type)" icon={Type} required>
                                <select
                                    id="job-type"
                                    name="jobType"
                                    value={form.jobType}
                                    onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}
                                    className={cn(
                                        'w-full px-3 py-2 text-sm border rounded-md bg-white text-gray-800',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                                        errors.jobType ? 'border-red-400' : 'border-gray-200'
                                    )}
                                    aria-invalid={!!errors.jobType}
                                    aria-describedby={errors.jobType ? 'jobttype-error' : undefined}
                                >
                                    <option value="">-- เลือกประเภทงาน --</option>
                                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {errors.jobType && <p id="jobtype-error" className="text-xs text-red-500" role="alert">{errors.jobType}</p>}
                            </FormField>

                            <hr className="border-gray-100" />
                            <p className="text-xs font-semibold text-gray-400 uppercase" aria-hidden="true">ข้อมูลลูกค้า</p>

                            <FormField htmlFor="customer-name" label="ชื่อลูกค้า (Customer Name)" icon={Building2} required>
                                <Input
                                    id="customer-name"
                                    name="customerName"
                                    autoComplete="organization"
                                    placeholder="เช่น บริษัท เจ.เอส. จำกัด…"
                                    value={form.customerName}
                                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                                    className={cn(errors.customerName && 'border-red-400 focus-visible:ring-red-400')}
                                    aria-invalid={!!errors.customerName}
                                    aria-describedby={errors.customerName ? 'cname-error' : undefined}
                                />
                                {errors.customerName && <p id="cname-error" className="text-xs text-red-500" role="alert">{errors.customerName}</p>}
                            </FormField>

                            <FormField htmlFor="customer-address" label="ที่อยู่" icon={MapPin}>
                                <textarea
                                    id="customer-address"
                                    name="customerAddress"
                                    rows={2}
                                    autoComplete="street-address"
                                    placeholder="เช่น 123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110…"
                                    value={form.customerAddress}
                                    onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 resize-none"
                                />
                            </FormField>

                            <FormField htmlFor="customer-phone" label="เบอร์โทร" icon={Phone}>
                                <Input
                                    id="customer-phone"
                                    name="customerPhone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="เช่น 02-123-4567…"
                                    value={form.customerPhone}
                                    onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                                />
                            </FormField>

                            <hr className="border-gray-100" />
                            <p className="text-xs font-semibold text-gray-400 uppercase" aria-hidden="true">รายละเอียดและราคา</p>

                            <FormField htmlFor="job-description" label="รายละเอียด (Description)" icon={AlignLeft}>
                                <textarea
                                    id="job-description"
                                    name="description"
                                    rows={3}
                                    placeholder="อธิบายรายละเอียดของงานซ่อม…"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 resize-none"
                                />
                            </FormField>

                            <FormField htmlFor="job-images" label="รูปภาพประกอบ (Images)" icon={ImageIcon}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="job-images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                <ImageIcon className="w-8 h-8 mb-3 text-blue-500/60" />
                                                <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง</p>
                                                <p className="text-xs text-gray-500">PNG, JPG, WEBP (สูงสุด 5MB · สูงสุด 5 ไฟล์)</p>
                                            </div>
                                            <input
                                                id="job-images"
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (!files) return;
                                                    const current = form.images || [];
                                                    const remaining = 5 - current.length;
                                                    if (remaining <= 0) return;
                                                    const newImages = Array.from(files).slice(0, remaining).map(file => URL.createObjectURL(file));
                                                    setForm(f => ({ ...f, images: [...(f.images || []), ...newImages] }));
                                                    // Reset input so same file can be re-selected
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {form.images && form.images.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {form.images.map((img, idx) => (
                                                <div key={idx} className="relative group w-20 h-20 mt-1">
                                                    <img src={img} alt="preview" className="w-full h-full object-cover rounded-md border border-gray-200" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setForm(f => ({
                                                                ...f,
                                                                images: (f.images || []).filter((_, i) => i !== idx)
                                                            }));
                                                            // Optional: URL.revokeObjectURL(img)
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormField>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField htmlFor="job-amount" label="ราคา (฿)" icon={AlignLeft}>
                                    <Input
                                        id="job-amount"
                                        name="amount"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="0…"
                                        value={form.amount || ''}
                                        onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                                    />
                                </FormField>
                                <FormField htmlFor="job-vat" label="VAT (%)" icon={AlignLeft}>
                                    <Input
                                        id="job-vat"
                                        name="taxRate"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={100}
                                        placeholder="7…"
                                        value={form.taxRate || ''}
                                        onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))}
                                    />
                                </FormField>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                    <Plus className="w-4 h-4" aria-hidden="true" />
                                    สร้างใบงาน + ออกเอกสาร
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleClearForm}
                                    aria-label="ล้างฟอร์ม"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT: Job List */}
                <div className="xl:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">
                            รายการใบงาน
                            <span className="ml-1 text-gray-400 font-normal">({jobs.length})</span>
                        </h2>
                        <div className="flex gap-1" aria-label="ประเภทเอกสารที่แก้ไขได้">
                            {(['quotation', 'invoice', 'receipt'] as DocumentType[]).map(d => (
                                <DocumentTypeBadge key={d} docType={d} />
                            ))}
                        </div>
                    </div>

                    {jobs.length === 0 ? (
                        <EmptyJobsState />
                    ) : (
                        <ul className="space-y-3" aria-label="รายการใบงาน">
                            {jobs.map(job => (
                                <li key={job.id}>
                                    <JobRow job={job} onOpenDoc={handleOpenDoc} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
