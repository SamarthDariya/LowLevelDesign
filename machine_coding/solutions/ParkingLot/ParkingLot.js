import ParkingSession from "./ParkingSession.js";

class ParkingLot {
    static #instance = null;
    #levels = null;

    constructor(){
        if(ParkingLot.#instance){
            throw Error("already intanciated parking lot");
        }
        this.#levels = [];
    }

    static get_instance(){
        if(ParkingLot.#instance){
            return ParkingLot.#instance;
        }
        ParkingLot.#instance = new ParkingLot();
        return ParkingLot.#instance;
    }

    add_level(level){
        this.#levels.push(level);
        console.log('added level in parking lot');
    }

    get_free_spots(){
        let free_spots = {};
        for(const level of this.#levels){
            let level_free_spots = level.get_free_spots();
            for (const type in level_free_spots) {
                free_spots[type] = (free_spots[type] || 0) + level_free_spots[type];
            }
        }
        return free_spots;
    }

    has_free_spot(type){
        for(const level of this.#levels){
            if(level.has_free_spot(type)){
                return true;
            }
        }
        return false;
    }

    assign_spot(vehicle){
        const type = vehicle.type;
        for(const level of this.#levels){
            if(level.has_free_spot(type)){
                const spot = level.assign_spot(type);
                const parking_session = new ParkingSession(vehicle,spot,level);
                console.log(`assigning spot to ${vehicle}`);
                return parking_session;
            }
        }
        console.log(`no free spot for ${vehicle} — lot full for ${type}`);
        return null;
    }

    free_spot(parking_session){
        if(!parking_session){
            console.log("invalid session — nothing to free");
            return;
        }
        parking_session.level.free_spot(parking_session.spot);
        console.log(`${parking_session} finished`)
    }
}

export default ParkingLot;