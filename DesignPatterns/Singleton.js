class Singleton {
    static #instance = null;

    constructor(){
        if(Singleton.#instance){
            throw Error("already instanciated the class");
        }

        Singleton.#instance = this;
    }

    static get_instance(){
        if(Singleton.#instance){
            return Singleton.#instance;
        }
        return new Singleton();
    }
}