/*
    Exercise: Chain of Responsibility — ATM Cash Dispenser

    Dispense a withdrawal amount using the fewest notes, each denomination handled by its own handler passing the remainder down the chain.

    Handler base: CashHandler with setNext(handler) (returns the handler passed in, for fluent chaining) and dispense(amount) (default: pass to next, or if no next and amount remains, report "cannot dispense remaining ₹X").

    Concrete handlers: Note2000Handler, Note500Handler, Note100Handler — each:
    - computes how many of its note fit (Math.floor(amount / denom)),
    - if ≥ 1, logs dispensing N x ₹denom,
    - computes the remainder (amount % denom),
    - passes the remainder to the next handler (via super.dispense(remainder)).

    (Note this is a hybrid: it's process-and-pass like middleware — every handler contributes — but the remainder shrinks as it flows, and it stops meaningfully when remainder hits 0.)

    Client (from the start):
    - Build the chain highest → lowest denomination (order matters! — that's what gives fewest notes).
    - Dispense a clean amount (e.g. ₹3600 → 1×2000, 3×500, 1×100).
    - Dispense an amount that leaves an un-dispensable remainder (e.g. ₹250 → 2×100, then ₹50 can't be dispensed) — proving the tail catch-all.

    Grading focus:
    - Base class owns setNext (returns passed handler) + the default pass-along / end-of-chain handling.
    - Each handler dispenses what it can, computes remainder, passes remainder on.
    - Chain order (high→low) is set by the client, and reordering would change behavior — proving composition is data.
    - Un-dispensable remainder handled gracefully at the tail.
*/

class BaseHandler {
    handle(amount,count_map){
        throw Error("function not implemented");
    }
}

class CashHandler extends BaseHandler {
    #next = null;
    setNext(handler){
        this.#next = handler;
        return handler;
    }

    handle(amount,count_map){
        if(this.#next !== null){
            return this.#next.handle(amount,count_map);
        }
        if(amount !== 0){
            return null;
        }
        return count_map;
    }
}

class AmountHandler extends CashHandler {
    handle(amount,count_map){
        return super.handle(amount,count_map);
    }
}

class Note2000Handler extends CashHandler {
    handle(amount,count_map){
        count_map["2000"] = Math.floor(amount/2000);
        if(amount % 2000 == 0){
            return count_map;
        }
        amount = amount%2000;
        return super.handle(amount,count_map);
    }
}

class Note500Handler extends CashHandler {
    handle(amount,count_map){
        count_map["500"] = Math.floor(amount/500);
        if(amount % 500 == 0){
            return count_map;
        }
        amount = amount%500;
        return super.handle(amount,count_map);
    }
}

class Note100Handler extends CashHandler {
    handle(amount,count_map){
        count_map["100"] = Math.floor(amount/100);
        if(amount % 100 == 0){
            return count_map;
        }
        amount = amount%100;
        return super.handle(amount,count_map);
    }
}

class ATM {
    handler= null;
    constructor(){
        this.handler = new AmountHandler();
        this.handler.setNext(new Note2000Handler())
            .setNext(new Note500Handler())
            .setNext(new Note100Handler());
    }

    fetch_amount(amount){
        let count_map = {};
        count_map = this.handler.handle(amount,count_map);
        if(count_map == null){
            console.log('amount entered is invalid');
            return;
        }
        for (const [key, value] of Object.entries(count_map)) {
            console.log(`${key}: ${value}`);
        }
        console.log("");
    }
}

//-------------client--------------------

const atm = new ATM();

atm.fetch_amount(67800);
atm.fetch_amount(5630);
atm.fetch_amount(56000);
atm.fetch_amount(67000);


/*
    a good solution
    class NoteHandler extends CashHandler {
    #denom;
    constructor(denom) { super(); this.#denom = denom; }
    handle(amount, count_map) {
        count_map[this.#denom] = Math.floor(amount / this.#denom);
        return super.handle(amount % this.#denom, count_map);
    }
    }
    // client: new NoteHandler(2000).setNext(new NoteHandler(500)).setNext(new NoteHandler(100))

*/