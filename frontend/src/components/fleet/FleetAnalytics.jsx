import React, { useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Zap,
    Activity,
    Calendar,
    Download
} from 'lucide-react';
import MetricCard from './shared/MetricCard';

const FleetAnalytics = () => {
    const [timeRange, setTimeRange] = useState('week');

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Mock data for analytics
    const energyData = [
        { name: 'Mon', usage: 4000, cost: 2400 },
        { name: 'Tue', usage: 3000, cost: 1398 },
        { name: 'Wed', usage: 2000, cost: 9800 },
        { name: 'Thu', usage: 2780, cost: 3908 },
        { name: 'Fri', usage: 1890, cost: 4800 },
        { name: 'Sat', usage: 2390, cost: 3800 },
        { name: 'Sun', usage: 3490, cost: 4300 },
    ];

    const driverPerformanceData = [
        { name: 'Safety', score: 85, fullMark: 100 },
        { name: 'Efficiency', score: 92, fullMark: 100 },
        { name: 'Punctuality', score: 88, fullMark: 100 },
        { name: 'Compliance', score: 95, fullMark: 100 },
        { name: 'Maintenance', score: 78, fullMark: 100 },
    ];

    const vehicleUtilizationData = [
        { name: 'Moving', value: 45 },
        { name: 'Charging', value: 25 },
        { name: 'Idle', value: 20 },
        { name: 'Maintenance', value: 10 },
    ];

    const costTrendData = [
        { month: 'Jan', fuel: 4000, maintenance: 2400, miscellaneous: 2400 },
        { month: 'Feb', fuel: 3000, maintenance: 1398, miscellaneous: 2210 },
        { month: 'Mar', fuel: 2000, maintenance: 9800, miscellaneous: 2290 },
        { month: 'Apr', fuel: 2780, maintenance: 3908, miscellaneous: 2000 },
        { month: 'May', fuel: 1890, maintenance: 4800, miscellaneous: 2181 },
        { month: 'Jun', fuel: 2390, maintenance: 3800, miscellaneous: 2500 },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg">
                    <p className="text-slate-200 font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-400" />
                        Fleet Analytics & Insights
                    </h2>
                    <p className="text-slate-400">Deep dive into fleet performance, costs, and utilization</p>
                </div>

                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {['day', 'week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors">
                    <Download className="h-4 w-4" />
                    Export Report
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Cost"
                    value="$12,450"
                    unit=""
                    icon={DollarSign}
                    trend={{ value: 12, direction: 'down', label: 'vs last period' }}
                    color="green"
                />
                <MetricCard
                    title="Energy Usage"
                    value="45.2"
                    unit="MWh"
                    icon={Zap}
                    trend={{ value: 8, direction: 'up', label: 'vs last period' }}
                    color="yellow"
                />
                <MetricCard
                    title="Efficiency"
                    value="3.8"
                    unit="mi/kWh"
                    icon={TrendingUp}
                    trend={{ value: 5, direction: 'up', label: 'improvement' }}
                    color="blue"
                />
                <MetricCard
                    title="Utilization"
                    value="82"
                    unit="%"
                    icon={Activity}
                    trend={{ value: 2, direction: 'down', label: 'vs last period' }}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Analysis Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-200 mb-6">Cost Analysis Trend</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={costTrendData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="month" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="fuel" stackId="1" stroke="#0088FE" fill="url(#colorFuel)" name="Energy Costs" />
                                <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#00C49F" fill="url(#colorMaint)" name="Maintenance" />
                                <Area type="monotone" dataKey="miscellaneous" stackId="1" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.3} name="Misc" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Energy Consumption vs Cost */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-200 mb-6">Energy Consumption vs. Cost</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={energyData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="usage" name="Usage (kWh)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="cost" name="Cost ($)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Driver Performance Radar (Simulated with Bar for simplicity in generic Recharts) */}
                {/* Note: Radar chart is better but Bar is safer if not fully configured. Using Bar for now. */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-200 mb-6">Average Fleet Driver Scores</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={driverPerformanceData}
                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="score" name="Score" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vehicle Utilization Pie Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-200 mb-6">Vehicle Utilization</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={vehicleUtilizationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {vehicleUtilizationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-6 rounded-xl">
                    <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Energy Optimization
                    </h4>
                    <p className="text-slate-300 text-sm">
                        Analysis suggests shifting 20% of charging sessions to off-peak hours (11 PM - 5 AM) could save approx. $1,200/month.
                    </p>
                    <button className="mt-4 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 py-1.5 px-3 rounded border border-indigo-500/30 transition-colors">
                        Apply Schedule Optimization
                    </button>
                </div>

                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 p-6 rounded-xl">
                    <h4 className="text-emerald-300 font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Range Prediction
                    </h4>
                    <p className="text-slate-300 text-sm">
                        Based on current weather and traffic patterns, average fleet range is predicted to decrease by 5% over the next 3 days.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/30 p-6 rounded-xl">
                    <h4 className="text-amber-300 font-semibold mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Maintenance Alert
                    </h4>
                    <p className="text-slate-300 text-sm">
                        3 vehicles showing irregular discharge patterns. Recommended battery health check for V-104, V-112, V-145.
                    </p>
                    <button className="mt-4 text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 py-1.5 px-3 rounded border border-amber-500/30 transition-colors">
                        Schedule Maintenance
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FleetAnalytics;
