/*

    Exercise: Abstract Factory — Cross-Platform UI Kit

    Render UI for Windows and MacOS, each with its own matching button and checkbox.

    Abstract Products: Button (render()), Checkbox (render()) — base throws.

    Concrete Products (two families):
    - WindowsButton → "rendering a Windows button", WindowsCheckbox → "rendering a Windows checkbox"
    - MacButton → "rendering a Mac button", MacCheckbox → "rendering a Mac checkbox"

    Abstract Factory: UIFactory with createButton() and createCheckbox() (base throws).

    Concrete Factories:
    - WindowsFactory → creates the Windows family
    - MacFactory → creates the Mac family

    Client: an Application(factory) that takes a UIFactory, calls createButton() + createCheckbox(), and renders them — containing zero platform ifs (the whole point).

    Bonus: a small factoryFor(os) selector (Simple Factory) that returns the right factory from a string like "windows" / "mac", with a guard for unknown OS.

    Client (from the start):
    - Build an Application with the Windows factory, render → both Windows widgets.
    - Build one with the Mac factory, render → both Mac widgets.
    - (Bonus) use factoryFor("windows") / factoryFor("mac").

*/

class Button {
    render(){
        throw Error("method not implemented");
    }
}

class Checkbox {
    render(){
        throw Error("method not implemented");
    }
}

class WindowsButton extends Button {
    render(){
        console.log("rendering a Windows button");
    }
}

class MacButton extends Button {
    render(){
        console.log("rendering a Mac button");
    }
}

class WindowsCheckbox extends Checkbox {
    render(){
        console.log("rendering a Windows checkbox");
    }
}

class MacCheckbox extends Checkbox {
    render(){
        console.log("rendering a Mac checkbox");
    }
}

class UIFactory {

    createButton(){
        throw Error("method not implemented");
    }
    createCheckbox(){
        throw Error("method not implemented");
    }
}

class WindowsFactory extends UIFactory {
    createButton(){
        return new WindowsButton();
    }
    createCheckbox(){
        return new WindowsCheckbox();
    }
}

class MacFactory extends UIFactory {
    createButton(){
        return new MacButton();
    }
    createCheckbox(){
        return new MacCheckbox();
    }
}

class Store {
    #windows_factory = null;
    #mac_factory = null;

    constructor(){
        this.#mac_factory = new MacFactory();
        this.#windows_factory = new WindowsFactory();
    }

    get_factory(os){
        if(os === "windows"){
            return this.#windows_factory;
        }
        if(os === "mac"){
            return this.#mac_factory;
        }
        throw Error("unknown os");
    }
}

//--------------------client---------------------------

const store = new Store();
const windows_factory = store.get_factory("windows");
const mac_factory = store.get_factory("mac");

const w_button=windows_factory.createButton();
const w_checkbox=windows_factory.createCheckbox();
w_button.render();
w_checkbox.render();

const m_button=mac_factory.createButton();
const m_checkbox=mac_factory.createCheckbox();
m_button.render();
m_checkbox.render();


