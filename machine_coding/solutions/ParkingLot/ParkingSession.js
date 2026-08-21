class ParkingSession {
    vehicle = null;
    spot = null;
    level = null;
    constructor(vehicle,spot,level){
        this.vehicle = vehicle;
        this.spot = spot;
        this.level = level;
    }
    toString(){
        return `${String(this.vehicle)} session`;
    }
}

export default ParkingSession;