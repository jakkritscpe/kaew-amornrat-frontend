import { MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function Contact() {
    return (
        <section id="contact" className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="bg-[#f8fafc] rounded-[2.5rem] p-6 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                        {/* Left Info */}
                        <div className="bg-[#00223A] rounded-3xl p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#044F88] rounded-full filter blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2" />

                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-8">ติดต่อเรา</h2>

                                <div className="space-y-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">พื้นที่ให้บริการ</h4>
                                            <p className="text-white/70 leading-relaxed">กรุงเทพมหานคร และปริมณฑล</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">เวลาทำการ</h4>
                                            <p className="text-white/70 leading-relaxed">บริการ 24 ชั่วโมง</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-16 pt-8 border-t border-white/10">
                                    <p className="text-lg font-medium text-white/50 mb-2">หจก.แก้วอมรรัตน์</p>
                                    <p className="text-sm text-white/50">บริการไอทีครบวงจร มืออาชีพ มาถึงที่</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Form */}
                        <div className="flex flex-col justify-center">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-[#00223A] mb-2">ส่งข้อความหาเรา</h3>
                                <p className="text-[#6f6f6f]">กรอกแบบฟอร์มด้านล่าง เราจะติดต่อกลับโดยเร็วที่สุด</p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                                        <Input id="name" placeholder="ระบุชื่อของคุณ" className="h-12 bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                                        <Input id="phone" placeholder="ระบุเบอร์โทรศัพท์" className="h-12 bg-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service">รับบริการ</Label>
                                    <Input id="service" placeholder="เช่น ซ่อมคอมพิวเตอร์, ติดตั้งกล้องวงจรปิด" className="h-12 bg-white" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">ข้อความ</Label>
                                    <Textarea id="message" placeholder="รายละเอียดที่ต้องการสอบถาม..." className="min-h-[120px] bg-white resize-none" />
                                </div>

                                <Button className="w-full h-14 bg-[#C2410C] hover:bg-[#C2410C]/90 text-white text-lg rounded-xl">
                                    <Send className="w-5 h-5 mr-2" />
                                    ส่งข้อความ
                                </Button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
