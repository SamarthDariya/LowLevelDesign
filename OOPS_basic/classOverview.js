// Creating a class
class Student {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    displayInfo() {
        console.log("Name:", this.name);
        console.log("Age:", this.age);
    }
}

// Creating an object
const student1 = new Student("Rahul", 20);

// Calling method
student1.displayInfo();



class one {
    constructor(name) {
        this.name = name
    }
    speaks() {
        return `my name is ${this.name}`
    }
}
class two extends one {
    constructor(name) {
        super(name)
    }
}
const o = new two('Pranjal')
console.log(o.speaks())