/*

    Exercise: Command — Smart Home Remote with Undo

    Receiver(s): a Light with on() / off() (track and log its state), and a Thermostat with setTemp(t) (track current temp).

    Command interface: Command with execute() and undo() (base throws).

    Concrete Commands:
    - LightOnCommand(light) → execute: light.on(); undo: light.off()
    - LightOffCommand(light) → execute: light.off(); undo: light.on()
    - SetTempCommand(thermostat, newTemp) → execute: set to newTemp but first capture the old temp; undo: restore the old temp. (This is your DeleteCommand-style "capture before-state" case — the whole point.)

    Invoker: RemoteControl with undoStack / redoStack:
    - submit(command) → execute, push to undo, clear redo.
    - undo() → pop undo, call undo(), push to redo.
    - redo() → pop redo, call execute(), push to undo.

    Client (from the start):
    - Turn light on, set temp to 24 (from some default like 20), turn light off.
    - undo() a couple times (should reverse light-off, then restore temp to 20).
    - redo() once.
    - Prove the redo-clear: do an undo, then submit a new command, then redo() — and show redo does nothing (stale future discarded).

    Grading focus:
    - SetTempCommand captures the old temp in execute() and restores it in undo() (the DeleteCommand lesson).
    - Two-stack undo/redo works; submit clears redo.
    - Prove the redo-clear scenario in the client.
    - Invoker knows nothing about Light/Thermostat — only about Command.

*/

class Light {
    on(){
        console.log("lights are on");
    }
    off(){
        console.log("lights are off");
    }
}
class Thermostat {
    #temp = null;
    constructor(){
        this.#temp = 20;
    }
    setTemp(t){
        this.#temp = t;
        console.log(`temp set to ${t}`);
    }
    getCurrTemp(){
        return this.#temp;
    }
}
class Command {
    execute(){
        throw Error("method not implemented");
    }
    undo(){
        throw Error("method not implemented");
    }
}

class LightOnCommand extends Command {
    #light = null;
    constructor(light){
        super();
        this.#light = light;
    }
    execute(){
        this.#light.on();
    }
    undo(){
        this.#light.off();
    }
}

class LightOffCommand extends Command {
    #light = null;
    constructor(light){
        super();
        this.#light = light;
    }
    execute(){
        this.#light.off();
    }
    undo(){
        this.#light.on();
    }
}

class SetTempCommand extends Command {
    #thermoStat = null;
    #newTemp = 0;
    #prevTemp = 0;
    constructor(thermoStat,newTemp){
        super();
        this.#thermoStat = thermoStat;
        this.#newTemp = newTemp;
    }
    execute(){
        this.#prevTemp = this.#thermoStat.getCurrTemp();
        // always remember to capture previous state before execution 
        this.#thermoStat.setTemp(this.#newTemp);
    }
    undo(){
        this.#thermoStat.setTemp(this.#prevTemp);
    }
}

class Invoker {
    #undo_stack = [];
    #redo_stack = [];

    runCommand(command){
        command.execute();
        this.#undo_stack.push(command);
        this.#redo_stack = [];
    }

    undo(){
        if(this.#undo_stack.length === 0){
            console.log('nothing to undo');
            return;
        }
        const command = this.#undo_stack.pop();
        command.undo();
        this.#redo_stack.push(command);
    }

    redo(){
        if(this.#redo_stack.length === 0){
            console.log('nothing to redo');
            return;
        }
        const command = this.#redo_stack.pop();
        command.execute();
        this.#undo_stack.push(command);
    }
}


//--------------------client-----------------------
const light = new Light();
const thermoStat = new Thermostat();

const invoker = new Invoker();

invoker.runCommand(new LightOnCommand(light));
invoker.runCommand(new SetTempCommand(thermoStat,24));
invoker.undo();
invoker.undo();
invoker.redo();
invoker.runCommand(new LightOffCommand(light));
invoker.redo();
invoker.undo();
