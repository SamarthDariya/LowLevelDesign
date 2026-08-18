/*
    Exercise: Composite — Org Chart Salary Rollup

    Model a company org chart and compute total salary cost of any subtree.

    Component: Employee with getSalaryCost() and print(indent) (base throws / or is the shared interface).

    Leaf: IndividualContributor(name, salary) — getSalaryCost() returns their own salary; print shows their name + salary.

    Composite: Manager(name, salary) — has their own salary plus a list of reports (which can be ICs or other Managers).
    - add(employee) (Composite-only — apply the Option B decision you just defended).
    - getSalaryCost() = the manager's own salary + the sum of all reports' getSalaryCost() (recursive — a report might be a manager with their own subtree).
    - print(indent) shows the manager, then recursively prints reports indented.

    Client (from the start):
    - Build a small 3-level tree: a CEO (Manager) → some VPs (Managers) → ICs under them.
    - Print the whole tree.
    - Call getSalaryCost() on the CEO (whole company) and on one VP (just that subtree) — proving the same method works at any level and rolls up correctly.

    Grading focus:
    - Leaf and Composite share the getSalaryCost() interface — client never type-checks.
    - Manager.getSalaryCost() includes its own salary + recursion over reports (don't forget the manager's own salary — common bug).
    - add is on Manager only (type safety).
    - Recursion bottoms out correctly at ICs.
*/

class Employee {
    name = null;
    salary = null;
    constructor(name,salary){
        this.name = name;
        this.salary = salary;
    }

    getSalaryCost(){
        throw Error("method not implemented");
    }

    print(indent = ""){
        throw Error("method not implemented");
    }

}

class IndividualContributor extends Employee {
    getSalaryCost(){
        return this.salary;
    }
    print(indent = ""){
        console.log(`${indent}${this.name}`);
    }
}

class Manager extends Employee {
    #reports = null;
    constructor(name,salary){
        super(name,salary);
        this.#reports = [];
    }
    add(employee){
        this.#reports.push(employee);
    }
    getSalaryCost(){
        const reports_cost = this.#reports.reduce((sum, reportee) => sum + reportee.getSalaryCost(), 0);
        return this.salary + reports_cost;
    }
    print(indent = ""){
        console.log(`${indent}${this.name}`);
        indent+='-';
        for(const reportee of this.#reports){
            reportee.print(indent)
        }
    }
}


//--------------------client--------------------

const samarth = new Manager("samarth",2000);
const saksham = new Manager("saksham",2000);
const pankaj = new Manager("Pankaj",4000);
pankaj.add(saksham);
pankaj.add(samarth);
const bob = new IndividualContributor("Bob",1000);
const alice = new IndividualContributor("Alice",1000);
samarth.add(bob);
saksham.add(alice);

console.log(pankaj.getSalaryCost());
console.log(samarth.getSalaryCost());
console.log(bob.getSalaryCost());

pankaj.print()