/*
Build an immutable Pizza via a fluent builder.

Product — Pizza:
- Fields: size (required), crust (default "regular"), cheese (boolean, default true), toppings (array, starts empty).
- Must be immutable after build() — freeze it (and the toppings array).
- Has a describe() that prints the pizza.

Builder — PizzaBuilder:
- Fluent setters, each returning this: setSize(size), setCrust(crust), noCheese(), addTopping(name).
- build() does cross-field validation in one place, then returns a frozen Pizza. At minimum:
  - size is required (throw if missing).
  - A cross-field rule of your choice — e.g. "a large pizza must have at least one topping" or "can't have more than 5 toppings." Pick one and enforce it in build().

Client (from the start ):
- Build one valid pizza with a few chained toppings and describe() it.
- Then trigger your validation with a deliberately invalid build (wrap in try/catch, log the rejection) — proving validation happens at the single build() choke point.

Grading focus:
- Setters return this (chaining actually works).
- The product is genuinely frozen — show that a post-build mutation attempt fails or is ignored.
- Validation lives only in build(), not scattered in setters.
- toppings is defensively handled (freezing the array, not leaking the live builder array).
*/


class Pizza {

    #size = null;
    #crust = null;
    #cheese = false;
    #toppings = [];

    static pizza_builder(){
        return new PizzaBuilder();
    }

    constructor(pizza_builder){
        this.#size = pizza_builder.size;
        this.#crust = pizza_builder.crust;
        this.#cheese = pizza_builder.cheese;
        this.#toppings = [...pizza_builder.toppings];
        Object.freeze(this.#toppings);
    }

    describe(){
        console.log(
            `built a size ${
                this.#size
            } pizza with ${
                this.#crust
            } crust ${
                this.#cheese ? "with cheese " : ""
            }${
                this.#toppings.length === 0 ? "you have no toppings": `you have ${[...this.#toppings].join(", ")} toppings`
            }`
        );
    }

}

class PizzaBuilder {

    size = null;
    crust = "regular";
    cheese = false;
    toppings = [];

    setSize(size){
        this.size = size;
        return this;
    }

    setCrust(crust){
        this.crust = crust;
        return this;
    }

    addCheese(){
        this.cheese = true;
        return this;
    }

    addTopping(topping){
        this.toppings.push(topping);
        return this;
    }

    getPizza(){
        if(!this.size){
            console.log('no size set')
            throw Error('no size set');
        }

        if(this.size == 'L' && (this.toppings.length === 0 || this.toppings.length > 5)){
            console.log('large pizza must have 1-5 toppings');
            throw Error('large pizza must have 1-5 toppings');
        }
        return new Pizza(this);
    }

}

//------------------------client------------------------------

const margrita = Pizza.pizza_builder()
                    .setSize("M")
                    .setCrust("thin")
                    .addCheese()
                    .addTopping("paneer")
                    .addTopping("onion")
                    .getPizza();
margrita.describe();

try{
    const plain = Pizza.pizza_builder()
                .getPizza();
} catch(e){
    console.log(e.message);
}
try{
const new_plain = Pizza.pizza_builder()
                    .setSize("L")
                    .getPizza();
}catch(e){
    console.log(e.message);
}

const new_plain2 = Pizza.pizza_builder()
                    .setSize("L")
                    .addTopping("onion")
                    .getPizza();
new_plain2.describe();