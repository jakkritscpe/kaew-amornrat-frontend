import { useEffect, useRef } from 'react';
import { Monitor, Video, Server, Wifi, Shield, Database, RefreshCcw } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
    {
        title: 'Computer',
        description: 'ซ่อมคอมพิวเตอร์ โน๊ตบุ๊ค เปลี่ยนอะไหล่',
        icon: Monitor,
        features: ['ซ่อมฮาร์ดแวร์', 'อัพเกรดอะไหล่', 'ลงโปรแกรม', 'กำจัดไวรัส']
    },
    {
        title: 'CCTV',
        description: 'ติดตั้งกล้องวงจรปิด ระบบรักษาความปลอดภัย',
        icon: Video,
        features: ['ติดตั้งกล้อง HD', 'ระบบ DVR/NVR', 'ดูผ่านมือถือ', 'บันทึกย้อนหลัง']
    },
    {
        title: 'Server',
        description: 'ติดตั้งและดูแลเซิร์ฟเวอร์',
        icon: Server,
        features: ['ติดตั้งเซิร์ฟเวอร์', 'กำหนดสิทธิ์ผู้ใช้', 'แบ็คอัพข้อมูล', 'มอนิเตอร์ริ่ง']
    },
    {
        title: 'Network LAN WiFi',
        description: 'ติดตั้ง LAN WiFi ครอบคลุมทุกพื้นที่',
        icon: Wifi,
        features: ['วางระบบสาย LAN', 'ติดตั้ง WiFi', 'ปรับแต่งสัญญาณ', 'ครอบคลุมทุกจุด']
    },
    {
        title: 'Firewall',
        description: 'ระบบความปลอดภัยเครือข่าย',
        icon: Shield,
        features: ['ตั้งค่า Firewall', 'ป้องกันการโจมตี', 'ควบคุมการเข้าถึง', 'รายงานความปลอดภัย']
    },
    {
        title: 'NAS',
        description: 'ระบบจัดเก็บข้อมูลแบบรวมศูนย์',
        icon: Database,
        features: ['ติดตั้ง NAS', 'กำหนดสิทธิ์', 'แชร์ไฟล์', 'เข้าถึงระยะไกล']
    },
    {
        title: 'Backup Data',
        description: 'ระบบสำรองข้อมูล ป้องกันข้อมูลสูญหาย',
        icon: RefreshCcw,
        features: ['แบ็คอัพอัตโนมัติ', 'กู้คืนข้อมูล', 'คลาวด์แบ็คอัพ', 'ป้องกันข้อมูลสูญหาย']
    }
];

export function Services() {
    const sectionRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                cardsRef.current,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="services" className="py-24 bg-[#f8fafc]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#00223A] mb-4">บริการของเรา</h2>
                    <p className="text-[#6f6f6f] text-lg max-w-2xl mx-auto">
                        ครบวงจร ทุกเรื่องไอที มืออาชีพ มาถึงที่
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <div
                                key={index}
                                ref={el => { cardsRef.current[index] = el; }}
                                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#044F88]/10 flex items-center justify-center mb-6 text-[#044F88]">
                                    <Icon className="w-7 h-7" />
                                </div>

                                <h3 className="text-xl font-bold text-[#00223A] mb-2">{service.title}</h3>
                                <p className="text-[#6f6f6f] mb-6 text-sm">{service.description}</p>

                                <ul className="space-y-3">
                                    {service.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center text-sm text-[#1d1d1d]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#044F88] mr-3" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
