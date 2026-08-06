/*

 A Product contract: every payment type can pay(amount) (log something + return a result object like { success: true, method: "..." }).
 Concrete Products: UpiPayment, CardPayment, WalletPayment — each pay() behaves a little differently (e.g. Card adds a 2% fee, UPI has a ₹1,00,000 limit, Wallet just deducts).
 A Creator with:
  - the factory method createProcessor() (throws in the base — must be overridden),
  - a shared workflow method checkout(amount) that validates amount > 0, calls the factory method, then calls pay() on the result. checkout must never mention a concrete payment class.
 Concrete Creators: UpiService, CardService, WalletService — each overrides createProcessor().
 A little client at the bottom that runs a couple of checkouts.

*/

class PaymentProcessor {
    constructor(){
    }

    pay(A,B,amount){
        throw Error('method not overloaded');
    }
}

class UpiProcessor extends PaymentProcessor {
    pay(A,B,amount){
        console.log(`${A} paid ${B} ${amount} through upi`)
    }
}

class CardProcessor extends PaymentProcessor {
    pay(A,B,amount){
        console.log(`${A} paid ${B} ${amount} through card`)
    }
}
class WalletProcessor extends PaymentProcessor {
    pay(A,B,amount){
        console.log(`${A} paid ${B} ${amount} through wallet`)
    }
}


class PaymentService {

    constructor(){

    }

    createProcessor() {
        throw Error('method not overloaded');
    }

    checkout(A,B,amount){
        if(amount<=0){
            console.log('invalid amount');
            throw Error("invalid amount");
        }
        const processor = this.createProcessor();
        processor.pay(A,B,amount);
    }

}

class UpiService extends PaymentService {
    createProcessor(){
        return new UpiProcessor();
    }
}

class CardService extends PaymentService {
    createProcessor(){
        return new CardProcessor();
    }
}

class WalletService extends PaymentService {
    createProcessor(){
        return new WalletProcessor();
    }
}
