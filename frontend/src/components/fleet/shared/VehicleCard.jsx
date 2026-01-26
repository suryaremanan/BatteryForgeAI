import React from 'react';
import { Battery, Zap, Activity, Wrench, MapPin, Thermometer } from 'lucide-react';

/**
 * Vehicle status card component
 */
const VehicleCard = ({ vehicle, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'charging': return 'border-blue-500/50 bg-blue-900/20';
            case 'idle': return 'border-slate-500/50 bg-slate-900/20';
            case 'moving': return 'border-emerald-500/50 bg-emerald-900/20';
            case 'maintenance': return 'border-red-500/50 bg-red-900/20';
            default: return 'border-white/10 bg-slate-900/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'charging': return <Zap className="w-4 h-4 text-blue-400" />;
            case 'idle': return <Activity className="w-4 h-4 text-slate-400" />;
            case 'moving': return <MapPin className="w-4 h-4 text-emerald-400" />;
            case 'maintenance': return <Wrench className="w-4 h-4 text-red-400" />;
            default: return null;
        }
    };

    const getSOCColor = (soc) => {
        if (soc < 20) return 'text-red-400';
        if (soc < 50) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const getTempColor = (temp) => {
        if (temp > 45) return 'text-red-400';
        if (temp > 38) return 'text-amber-400';
        return 'text-slate-400';
    };

    return (
        <div
            onClick={() => onClick && onClick(vehicle)}
            className={`rounded-lg border ${getStatusColor(vehicle.status)} p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(vehicle.status)}
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            {vehicle.status}
                        </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{vehicle.id}</h4>
                    <p className="text-xs text-slate-400">{vehicle.model}</p>
                </div>
                <div className={`text-right ${getSOCColor(vehicle.currentSOC)}`}>
                    <Battery className="w-5 h-5 ml-auto mb-1" />
                    <span className="text-sm font-bold">{Number(vehicle.currentSOC).toFixed(2)}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <Thermometer className={`w-3 h-3 ${getTempColor(vehicle.temperature)}`} />
                    <span className={getTempColor(vehicle.temperature)}>{Number(vehicle.temperature).toFixed(1)}°C</span>
                </div>
                <div>
                    {(vehicle.odometer / 1000).toFixed(0)} km
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;
