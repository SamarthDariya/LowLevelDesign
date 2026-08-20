/*

    Exercise: Iterator — Number Range

    Build a NumberRange class that's iterable, so for...of and spread work on it.

    NumberRange(start, end, step = 1):
    - Implement *[Symbol.iterator]() as a generator that yields start, start+step, start+2*step, ... up to (and including, or excluding — your call, just be consistent) end.

    Bonus (shows you get laziness): add an infinite generator method *fromStart() that yields start, start+step, start+2*step, ... forever (no end). Then in the client, consume just the first 5 using a for...of with a counter + break — proving an infinite generator is safe because it's lazy.

    Client (from the start):
    - for (const n of new NumberRange(0, 10, 2)) → prints 0 2 4 6 8 10
    - console.log([...new NumberRange(1, 5)]) → [1,2,3,4,5] (spread works → proves it's a real iterable)
    - Bonus: take the first 5 from fromStart() and print them, proving the infinite generator doesn't hang.

    Grading focus:
    - [Symbol.iterator] is a generator that yields the sequence.
    - for...of and spread both work (that's the proof it's a proper iterable).
    - Bonus: infinite generator consumed safely with break (laziness in action).

*/

class NumberRange {
    #start = null;
    #end = null;
    #step = null;

    constructor(start,end,step=1){
        this.#start = start;
        this.#end = end;
        this.#step = step;
    }

    *[Symbol.iterator](){
        let curr_num = this.#start;
        while(curr_num <= this.#end){
            yield curr_num;
            curr_num+=this.#step;
        }
    }

    *fromStart(){
        let current = this.#start;
        while (true) {        
            yield current;
            current += this.#step;
        }
    }
}

//---------------------client--------------------

const num_range_1 = new NumberRange(0,20,4);
const num_range_2 = new NumberRange(3,21,3);

for(const num of num_range_1){
    console.log(num);
}

let count = 0;
for (const n of num_range_2.fromStart()) {
  console.log(n);
  count++;
  if (count === 5) break;  
}

console.log([...new NumberRange(1,5)]);



//-------------------not using inbuilt ----------------------


class RangeIterator {
    #curr=null;
    #end=null;
    #step = null;
    constructor(start,end,step){
        this.#curr = start;
        this.#end = end;
        this.#step = step;
    }
    hasNext(){
        return this.#curr <= this.#end;
    }

    next() {
        const value = this.#curr;            
        this.#curr += this.#step;            
        return value;
    }
}

class SelfNumRange {
    #start; #end; #step;
    constructor(start, end, step = 1) {
        this.#start = start; this.#end = end; this.#step = step;
    }
    getIterator() {                            
        return new RangeIterator(this.#start, this.#end, this.#step);
    }
}

const n_num_r = new SelfNumRange(0,25,5);
const it = n_num_r.getIterator();

while(it.hasNext()){
    console.log(it.next());
}

