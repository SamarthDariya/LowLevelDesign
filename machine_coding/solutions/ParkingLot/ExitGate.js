class ExitGate {
    parking_lot = null;
    constructor(parking_lot){
        this.parking_lot = parking_lot;
    }

    exit(parking_session){
        if(!parking_session){
            console.log("no valid session presented at exit");
            return;
        }
        this.parking_lot.free_spot(parking_session);
    }
}

export default ExitGate;