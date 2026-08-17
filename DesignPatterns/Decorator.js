/*
Component (interface): Pizza with cost() and description() (base class throws if not overridden).

Concrete Components (base pizzas):
- Margherita → cost 200, description "Margherita"
- Farmhouse → cost 300, description "Farmhouse"

Base Decorator: ToppingDecorator — is-a Pizza and has-a Pizza; by default delegates cost()/description() straight through to the wrapped pizza.

Concrete Decorators (toppings):
- ExtraCheese → +50, ", extra cheese"
- Olives → +30, ", olives"
- Paneer → +70, ", paneer"

Each concrete decorator calls super.cost() (delegates down the stack) then adds its own delta.

Client (from the start):
- Build new ExtraCheese(new Olives(new Margherita())) and print description + cost.
- Prove stacking + repetition: wrap the same topping twice (e.g. new Paneer(new Paneer(new Farmhouse()))) — the thing inheritance couldn't do — and print it.
- Include a printReceipt(pizza) function that takes any Pizza and prints it — call it with both a plain pizza and a decorated one, proving the client can't tell them apart.

Grading focus:
- Decorator is is-a Pizza AND has-a Pizza.
- Each decorator delegates via super.cost() then adds its delta (don't hardcode the base price inside the topping).
- Double-topping works (Paneer(Paneer(...))).
- printReceipt treats plain and decorated identically.

*/

class Pizza {

    constructor(){
    }
    
    cost(){
        throw Error("Not implemented");
    }
    description(){
        throw Error("Not implemented");
    }
    give_breakdown(){
        throw Error("Not implemented");
    }
}

class MargheritaPizza extends Pizza {
    cost(){
        return 200;
    }
    description(){
        return "Margherita";
    }
    give_breakdown(){
        return {"Margherita":200};
    }
}

class FarmhousePizza extends Pizza {
    cost(){
        return 300;
    }
    description(){
        return "Farmhouse";
    }
    give_breakdown(){
        return {"Farmhouse":300};
    }
}

class Addons extends Pizza {
    #base = null;
    constructor(base){
        super();
        this.#base = base;
    }
    get_base_cost(){
        return this.#base.cost();
    }
    get_base_description(){
        return this.#base.description();
    }
    get_base_breakdown(){
        return this.#base.give_breakdown();
    }
    cost(){
        throw Error("Not implemented");
    }
    description(){
        throw Error("Not implemented");
    }
    give_breakdown(){
        throw Error("Not implemented");
    }
}

class ExtraCheese extends Addons {

    cost(){
        return 50 + this.get_base_cost();
    }

    description(){
        return this.get_base_description() + ", extra cheese"
    }
    give_breakdown(){
        let _breakdown = {...this.get_base_breakdown()};
        if(!_breakdown.extracheese){
            _breakdown.extracheese = 0;
        }
        _breakdown.extracheese+=50;
        return _breakdown;
    }

}

class Olives extends Addons {

    cost(){
        return 30 + this.get_base_cost();
    }

    description(){
        return this.get_base_description() + ", olives"
    }

    give_breakdown(){
        let _breakdown = {...this.get_base_breakdown()};
        if(!_breakdown.olives){
            _breakdown.olives = 0;
        }
        _breakdown.olives+=30;
        return _breakdown;
    }

}

class Paneer extends Addons {
    cost(){
        return 70 + this.get_base_cost();
    }

    description(){
        return this.get_base_description() + ", paneer"
    }

    give_breakdown(){
        let _breakdown = {...this.get_base_breakdown()};
        if(!_breakdown.paneer){
            _breakdown.paneer = 0;
        }
        _breakdown.paneer+=70;
        return _breakdown;
    }
}


function printReceipt(pizza){
    return `${pizza.description()} => ${pizza.cost()}`;
}

function print_breakdown(pizza){
    return pizza.give_breakdown();
}

// -------------------------client--------------------------

const first_pizza = new ExtraCheese(new Olives(new MargheritaPizza()));
console.log(printReceipt(first_pizza));
console.log(print_breakdown(first_pizza));
const second_pizza = new Paneer(new Paneer(new FarmhousePizza()));
console.log(printReceipt(second_pizza));
console.log(print_breakdown(second_pizza));
console.log(printReceipt(new MargheritaPizza()));
console.log(print_breakdown(new MargheritaPizza()));