class Spot {
    type = null;
    #free = null;
    constructor(type){
        this.type = type;
        this.#free = true;
    }
    is_free(){
        return this.#free;
    }
    occupy(){
        this.#free = false;
    }
    leave(){
        this.#free = true;
    }
}

export default Spot;