class Vehicle {
    type = null;
    #license_plate = null;

    constructor(type,license_plate){
        this.type = type;
        this.#license_plate = license_plate;
    }

    toString() {
        return `${this.type} : ${this.#license_plate}`;
    }
}

export default Vehicle;