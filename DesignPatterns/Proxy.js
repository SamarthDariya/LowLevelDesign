/*
    Exercise: Proxy — Protected + Caching Config Service

    Subject interface: ConfigService with get(key) (base throws if not overridden).

    Real Subject: RealConfigService — its get(key) simulates an expensive DB read (log something like (reading "${key}" from DB...)) and returns a value (e.g. `value-for-${key}`).

    Proxy: ConfigServiceProxy — same interface, and does two flavors at once (like your notes' salary example):
    1. Protection: constructed with a user ({ role }). Only role === "admin" may read; otherwise throw.
    2. Caching: memoize results in a Map so a repeated get(key) for the same key never hits the real service again (no second "reading from DB" log).
    3. (Bonus — virtual): don't even create the RealConfigService until the first allowed, uncached get() — lazy init.

    Client (from the start):
    - An admin proxy: get("timeout") (hits DB), get("timeout") again (served from cache — no DB log), get("retries") (hits DB).
    - A non-admin proxy: get("timeout") wrapped in try/catch — prove it's blocked before ever touching the real service.

    Grading focus:
    - Proxy shares the ConfigService interface (client can't tell it apart).
    - Protection check happens before any DB access.
    - Cache actually prevents the second DB read (you'll see it in the output — the DB log appears once per unique key, not per call).
    - Bonus: real service isn't constructed until the first allowed+uncached call.
*/

class ConfigService {

    set(key,value){
        throw Error("method not implemented");
    }

    get(key){
        throw Error("method not implemented");
    }
}

class RealConfigService extends ConfigService {
    #db = null;

    constructor(){
        super();
        this.#db = {};
    }

    set(key,value){
        console.log(`setting ${key} in DB`)
        this.#db[key] = value;
    }

    get(key){
        console.log(`reading ${key} from DB`)
        return this.#db[key]
    }

}

class ConfigServiceProxy extends ConfigService {
    #config_service = null;
    #cache = null;
    #user = null;
    #read_access_roles = ["ADMIN"];
    #write_access_roles = ["ADMIN"];
    constructor(user){
        super();
        this.#config_service = null;
        this.#cache = {};
        this.#user = user;
    }

    _has_read_access(){
        for(const allowed of this.#read_access_roles){
            if(allowed == this.#user.role){
                return true;
            }
        }
        return false;
    }

    _has_write_access(){
        for(const allowed of this.#write_access_roles){
            if(allowed == this.#user.role){
                return true;
            }
        }
        return false;
    }

    get(key){
        if(!this._has_read_access()){
            throw Error(`${this.#user.name} does not have read access`);
        }
        if(this.#config_service == null){
            this.#config_service = new RealConfigService()
        }
        if(!(key in this.#cache)){
            const value = this.#config_service.get(key);
            this.#cache[key] = value;
            return value;
        }
        return this.#cache[key];
    }
    set(key,value){
        if(!this._has_write_access()){
            throw Error(`${this.#user.name} does not have write access`);
        }
        if(this.#config_service == null){
            this.#config_service = new RealConfigService()
        }
        this.#config_service.set(key,value);
    }
}


//------------------client---------------------

const samarth = {"name":"samarth","role":"ADMIN"}
const saksham = {"name":"saksham","role":"NOT_ADMIN"}

samarth_proxy = new ConfigServiceProxy(samarth);
saksham_proxy = new ConfigServiceProxy(saksham);

try{
    saksham_proxy.set("name","saksham");
}catch(e){
    console.log(e.message);
}
samarth_proxy.set("name","samarth");
try{
    saksham_proxy.get("name");
}catch(e){
    console.log(e.message);
}
console.log(samarth_proxy.get("name"));
console.log(samarth_proxy.get("name"));