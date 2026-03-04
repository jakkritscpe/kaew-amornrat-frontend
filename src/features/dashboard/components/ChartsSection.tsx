import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthlyData, StatusDistribution } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface ChartsSectionProps {
  monthlyData: MonthlyData[];
  statusDistribution: StatusDistribution[];
}

export default function ChartsSection({ monthlyData, statusDistribution }: ChartsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<SVGSVGElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line chart draw animation
      const path = lineChartRef.current?.querySelector('path');
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        });
      }

      // Donut chart scale animation
      gsap.fromTo(donutRef.current,
        { scale: 0, rotate: -90 },
        {
          scale: 1,
          rotate: 0,
          duration: 1,
          delay: 0.3,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Legend fade up
      gsap.fromTo('.chart-legend',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.5,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Pin and zoom effect
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'center center',
        end: 'bottom center',
        scrub: 1,
        onUpdate: (self) => {
          gsap.to('.chart-container', {
            scale: 1 + (self.progress * 0.05),
            duration: 0.1
          });
        }
      });
    });

    return () => ctx.revert();
  }, []);

  // Calculate line chart points
  const maxValue = Math.max(...monthlyData.map(d => d.requests));
  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;

  const points = monthlyData.map((data, index) => {
    const x = padding + (index * (chartWidth - 2 * padding) / (monthlyData.length - 1));
    const y = chartHeight - padding - ((data.requests / maxValue) * (chartHeight - 2 * padding));
    return { x, y, data };
  });

  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Calculate donut chart
  const donutRadius = 80;
  const donutStroke = 20;
  const circumference = 2 * Math.PI * donutRadius;

  const statusColors: Record<string, string> = {
    'pending': '#f5a623',
    'in-progress': '#2075f8',
    'completed': '#0cbc7c'
  };

  const statusLabels: Record<string, string> = {
    'pending': 'รอดำเนินการ',
    'in-progress': 'กำลังซ่อม',
    'completed': 'เสร็จสิ้น'
  };

  return (
    <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Line Chart */}
      <div className="lg:col-span-2 chart-container">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#2075f8]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1d1d1d]">แนวโน้มการแจ้งซ่อม</h3>
                <p className="text-sm text-[#6f6f6f]">7 เดือนที่ผ่านมา</p>
              </div>
            </div>
          </div>

          <div className="relative h-64">
            <svg
              ref={lineChartRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1={padding}
                  y1={padding + (i * (chartHeight - 2 * padding) / 4)}
                  x2={chartWidth - padding}
                  y2={padding + (i * (chartHeight - 2 * padding) / 4)}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2075f8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2075f8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`}
                fill="url(#areaGradient)"
              />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#2075f8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="chart-line"
              />

              {/* Data points */}
              {points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredMonth === index ? 8 : 5}
                    fill="white"
                    stroke="#2075f8"
                    strokeWidth="3"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredMonth(index)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  />

                  {/* Tooltip */}
                  {hoveredMonth === index && (
                    <g>
                      <rect
                        x={point.x - 40}
                        y={point.y - 50}
                        width="80"
                        height="35"
                        rx="8"
                        fill="#1d1d1d"
                      />
                      <text
                        x={point.x}
                        y={point.y - 30}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {point.data.requests} รายการ
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* X-axis labels */}
              {points.map((point, index) => (
                <text
                  key={`label-${index}`}
                  x={point.x}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="#6f6f6f"
                  fontSize="12"
                >
                  {point.data.month}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="chart-container">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1d1d1d]">สถานะการซ่อม</h3>
              <p className="text-sm text-[#6f6f6f]">แจกแจงตามสถานะ</p>
            </div>
          </div>

          <div ref={donutRef} className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {statusDistribution.map((item, index) => {
                  const currentCumulative = statusDistribution.slice(0, index).reduce((sum, curr) => sum + curr.percentage, 0);
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -currentCumulative * circumference / 100;

                  return (
                    <circle
                      key={item.status}
                      cx="100"
                      cy="100"
                      r={donutRadius}
                      fill="none"
                      stroke={statusColors[item.status]}
                      strokeWidth={hoveredSegment === index ? donutStroke + 5 : donutStroke}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-300 donut-segment"
                      style={{
                        transformOrigin: 'center',
                        transform: hoveredSegment === index ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  );
                })}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#1d1d1d]">
                  {statusDistribution.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </span>
                <span className="text-sm text-[#6f6f6f]">รายการ</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-3 w-full">
              {statusDistribution.map((item, index) => (
                <div
                  key={item.status}
                  className={cn(
                    'chart-legend flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer',
                    hoveredSegment === index && 'bg-gray-50'
                  )}
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[item.status] }}
                    />
                    <span className="text-sm text-[#1d1d1d]">{statusLabels[item.status]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.count}</span>
                    <span className="text-xs text-[#6f6f6f]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
