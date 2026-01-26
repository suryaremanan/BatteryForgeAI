"""
Fleet Data Models
Defines database models for vehicles, drivers, routes, and charging
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Vehicle(Base):
    __tablename__ = 'vehicles'
    
    id = Column(String, primary_key=True)  # EV-001
    model = Column(String, nullable=False)
    license_plate = Column(String, unique=True, nullable=False)
    battery_capacity = Column(Integer, nullable=False)  # kWh
    
    # Real-time status
    status = Column(String, default='idle')  # charging/idle/moving/maintenance
    current_soc = Column(Float, default=100)  # State of Charge (%)
    current_soh = Column(Float, default=100)  # State of Health (%)
    odometer = Column(Float, default=0)  # km
    temperature = Column(Float)  # °C
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Relationships
    assigned_driver_id = Column(String, ForeignKey('drivers.id'))
    assigned_driver = relationship("Driver", back_populates="vehicle")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'model': self.model,
            'licensePlate': self.license_plate,
            'batteryCapacity': self.battery_capacity,
            'status': self.status,
            'currentSOC': self.current_soc,
            'currentSOH': self.current_soh,
            'odometer': self.odometer,
            'temperature': self.temperature,
            'location': {
                'lat': self.latitude,
                'lng': self.longitude
            },
            'assignedDriver': self.assigned_driver_id,
            'lastUpdate': self.last_update.isoformat() if self.last_update else None
        }


class Driver(Base):
    __tablename__ = 'drivers'
    
    id = Column(String, primary_key=True)  # DR-001
    full_name = Column(String, nullable=False)
    phone = Column(String)
    license_number = Column(String, unique=True)
    
    # Performance metrics
    safety_score = Column(Float, default=100)
    efficiency_rating = Column(Float, default=100)
    total_trips = Column(Integer, default=0)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="assigned_driver", uselist=False)
    
    # Timestamps
    join_date = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'fullName': self.full_name,
            'phone': self.phone,
            'licenseNumber': self.license_number,
            'safetyScore': self.safety_score,
            'efficiencyRating': self.efficiency_rating,
            'totalTrips': self.total_trips,
            'assignedVehicle': self.vehicle.id if self.vehicle else None,
            'joinDate': self.join_date.isoformat() if self.join_date else None
        }


class ChargingStation(Base):
    __tablename__ = 'charging_stations'
    
    id = Column(String, primary_key=True)  # CS-001
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    status = Column(String, default='available')  # available/in_use/maintenance
    total_ports = Column(Integer, default=4)
    available_ports = Column(Integer, default=4)
    power_output = Column(Integer, default=150)  # kW
    cost_per_kwh = Column(Float, default=0.35)  # $/kWh
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': {
                'lat': self.latitude,
                'lng': self.longitude
            },
            'status': self.status,
            'totalPorts': self.total_ports,
            'availablePorts': self.available_ports,
            'powerOutput': self.power_output,
            'cost': self.cost_per_kwh
        }


class ChargingSchedule(Base):
    __tablename__ = 'charging_schedules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String, ForeignKey('vehicles.id'), nullable=False)
    station_id = Column(String, ForeignKey('charging_stations.id'))
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    target_soc = Column(Integer, nullable=False)  # Target SOC %
    
    status = Column(String, default='scheduled')  # scheduled/active/completed/cancelled
    energy_delivered = Column(Float, default=0)  # kWh
    cost = Column(Float, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Route(Base):
    __tablename__ = 'routes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    assigned_vehicle_id = Column(String, ForeignKey('vehicles.id'))
    assigned_driver_id = Column(String, ForeignKey('drivers.id'))
    
    waypoints = Column(JSON)  # List of {lat, lng, name}
    distance = Column(Float)  # km
    estimated_energy = Column(Float)  # kWh
    estimated_duration = Column(Integer)  # minutes
    
    status = Column(String, default='scheduled')  # scheduled/active/completed/cancelled
    
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    actual_energy_used = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Settings(Base):
    __tablename__ = 'settings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, nullable=False)  # units/notifications/map/api
    key = Column(String, nullable=False)
    value = Column(String)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
