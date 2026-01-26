import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Reusable metric card component for dashboard KPIs
 */
const MetricCard = ({
    title,
    value,
    unit = '',
    icon: Icon,
    trend = null, // 'up', 'down', 'neutral'
    trendValue = null,
    color = 'blue',
    subtitle = null
}) => {
    const colorClasses = {
        blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',
        green: 'from-emerald-500/10 to-green-500/10 border-emerald-500/30',
        amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
        red: 'from-red-500/10 to-rose-500/10 border-red-500/30',
        purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/30'
    };

    const iconColorClasses = {
        blue: 'text-blue-400',
        green: 'text-emerald-400',
        amber: 'text-amber-400',
        red: 'text-red-400',
        purple: 'text-purple-400'
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Minus className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm p-4 transition-all hover:scale-[1.02]`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{value}</span>
                        {unit && <span className="text-sm text-slate-400">{unit}</span>}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg bg-black/20 ${iconColorClasses[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {trendValue !== null && (
                <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon()}
                    <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}>
                        {trendValue}
                    </span>
                    <span className="text-slate-500">vs last period</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
