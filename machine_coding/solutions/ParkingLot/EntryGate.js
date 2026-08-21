class EntryGate {
    parking_lot = null;
    constructor(parking_lot){
        this.parking_lot = parking_lot;
    }

    enter(vehicle){
        const parking_session = this.parking_lot.assign_spot(vehicle);
        return parking_session;
    }
}

export default EntryGate;