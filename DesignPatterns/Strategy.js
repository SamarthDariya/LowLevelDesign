/*
1. Strategy contract: applyDiscount(amount) → returns the discounted amount (base class throws if not overridden).
2. Concrete strategies:
  - NoDiscount → returns amount unchanged
  - PercentageDiscount(percent) → knocks off percent% (store percent as private state — this is why it's a class, not just a function)
  - FlatDiscount(flat) → subtracts a flat amount (but never below 0)
3. Context: a Cart that holds items, has setDiscountStrategy(strategy), and a checkout() that sums items, calls applyDiscount() on the total via delegation (never an if/else on discount type), and logs the final price.
4. Client: create a cart, check out with one strategy, then swap the strategy at runtime and check out again to prove the same cart behaves differently.
*/


class CheckoutCart {
  #original_amount = 0;
  #discountStrategy = null;

  constructor(amount = 0){
    if(amount < 0) throw Error("amount should be non-negative");
    this.#original_amount = amount;
  }

  addItem(price) {
    this.#original_amount += price;
    return this;
  }

  // The strategy is swappable at runtime — this is the whole point.
  setDiscountStrategy(strategy) {
    this.#discountStrategy = strategy;
  }

  get_final_price() {
    if (!this.#discountStrategy) {
      throw new Error('No discount strategy selected');
    }
    const final_price = this.#discountStrategy.applyDiscount(this.#original_amount);
    console.log(`Original: ${this.#original_amount} -> Final: ${final_price}`);
    return final_price;
  }
}

class DiscountStrategy {

    factor = null

    constructor(factor){
        this.factor = factor;
    }

    applyDiscount(original_amount,){
        throw Error("abstract method not implemeted");
    }
}

class NoDiscountStrategy extends DiscountStrategy{ 

    applyDiscount(original_amount){
        return original_amount;
    }
}

class PercentageDiscountStrategy extends DiscountStrategy{ 
   
    applyDiscount(original_amount){
        return original_amount - this.factor*original_amount;
    }
}

class FlatDiscountStrategy extends DiscountStrategy{ 
    
    applyDiscount(original_amount){
        return Math.max(original_amount - this.factor,0);
    }
}

// ---------- Client ----------
const cart = new CheckoutCart().addItem(100).addItem(50); // total = 150

cart.setDiscountStrategy(new NoDiscountStrategy());
cart.get_final_price();                                   // 150 -> 150

cart.setDiscountStrategy(new PercentageDiscountStrategy(0.2)); // 20% off
cart.get_final_price();                                   // 150 -> 120

// swap AGAIN at runtime — same cart, different behavior:
cart.setDiscountStrategy(new FlatDiscountStrategy(200));  // flat 200, floored at 0
cart.get_final_price();                                   // 150 -> 0

