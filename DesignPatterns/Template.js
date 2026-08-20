/*

    Exercise: Template Method — Beverage Maker

    Making tea and coffee follows the same recipe: boil water → brew → pour into cup → add condiments. Only brew and add condiments differ.

    Abstract class Beverage:
    - Template method prepare() — calls, in fixed order: boilWater() → brew() → pourInCup() → addCondiments(). This method is the skeleton; subclasses never override it.
    - Fixed steps (implemented in base, same for all): boilWater() → log "boiling water", pourInCup() → log "pouring into cup".
    - Abstract steps (throw in base, subclass must implement): brew(), addCondiments().
    - Hook (bonus): wantsCondiments() returning true by default; addCondiments() only runs if it's true. Let one subclass override it to false (e.g. black coffee, no condiments).

    Concrete classes:
    - Tea → brew: "steeping the tea", addCondiments: "adding lemon".
    - Coffee → brew: "dripping coffee through filter", addCondiments: "adding sugar and milk".
    - (Optional third) BlackCoffee → overrides wantsCondiments() to false.

    Client (from the start):
    - new Tea().prepare(); then new Coffee().prepare(); — same skeleton, different brew/condiments.
    - If you do BlackCoffee, show its prepare() skipping condiments (the hook in action).

    Grading focus:
    - prepare() is the template method with a fixed step order; subclasses never touch it.
    - brew/addCondiments are abstract (base throws); fixed steps live in base.
    - The hook (wantsCondiments) gates the optional step.
    - Subclasses only fill blanks — no reordering.

*/

class Beverage {
    prepare(){
        this.#boilWater();
        this.brew();
        this.#pourInCup();
        if(this.wantsCondiments()){
            this.addCondiments();
        }
    }
    #boilWater(){
        console.log('boiling water');
    }
    #pourInCup(){
        console.log('pouring in cup');
    }
    wantsCondiments(){
        return true;
    }
    brew(){
        throw Error("method not implemented");
    }
    addCondiments(){
        throw Error("method not implemented");
    }
}

class Tea extends Beverage {
    brew(){
        console.log("steeping the tea");
    }
    addCondiments(){
        console.log("adding lemon");
    }
}

class Coffee extends Beverage {
    brew(){
        console.log("dripping coffee through filter");
    }
    addCondiments(){
        console.log("adding sugar and milk");
    }
}
class BlackCoffee extends Beverage {
    brew(){
        console.log("dripping coffee through filter");
    }
    wantsCondiments(){
        return false;
    }
}

//----------------client----------------------

const tea = new Tea();
const coffee = new Coffee();
const black_coffee = new BlackCoffee();

tea.prepare();
console.log("");
coffee.prepare();
console.log("");
black_coffee.prepare();