/*
A music player with three states: Stopped, Playing, Paused. Three actions: play(), pause(), stop(). Behavior depends entirely on the current state.

The state machine (transitions):
Stopped --play-->  Playing
Playing --pause--> Paused
Playing --stop-->  Stopped
Paused  --play-->  Playing   (resume)
Paused  --stop-->  Stopped
Anything not listed is an invalid action for that state (e.g. pause() while Stopped → "Nothing is playing").

Requirements:
1. State base class (PlayerState) with play(), pause(), stop() — each defaulting to a "can't do that now" message (so concrete states only override what they support — use the base-default trick from your vending-machine notes).
2. Concrete states: StoppedState, PlayingState, PausedState. Each overrides only the actions valid for it, logs what happens, and triggers its own transition via this.player.setState(...).
3. Context (MediaPlayer): holds the current state, pre-creates one instance of each state (they're stateless), exposes setState(state), and delegates play()/pause()/stop() to the current state — no switch anywhere.
4. Client (write it from the start ): drive a realistic sequence, e.g. play → pause → play → stop → pause — and let that last pause (while stopped) prove the invalid-action handling.

Grading focus:
- Zero switch/if-on-state in MediaPlayer — pure delegation.
- States trigger their own transitions (this is what makes it State, not Strategy) — each valid action calls this.player.setState(this.player.someState).
- Base-class defaults so concrete states stay small.
- Client runs and the invalid action is handled gracefully (log, don't crash).
*/

class JukeBox {
    #music = null;
    #CurrState = null;
    #states = {};

    constructor(music){
        this.#music = music;
        this.#CurrState = "stopped";
        this.#states = {
            "stopped" : new StoppedState(this),
            "playing" : new PlayingState(this),
            "paused" : new PausedState(this)
        }
    }

    setState(state){
        this.#CurrState = state;
    }

    play(){
        this.#states[this.#CurrState].play(this.#music);
    }

    pause(){
        this.#states[this.#CurrState].pause(this.#music);
    }

    stop(){
        this.#states[this.#CurrState].stop(this.#music);
    }
}

class JukeBoxState {

    jukebox = null;

    constructor(jukebox){
        this.jukebox = jukebox;
    }

    play(music){
        console.log(`can't play ${music}`);
    }

    pause(music){
        console.log(`can't pause ${music}`);
    }

    stop(music){
        console.log(`can't stop ${music}`);
    }

}

class StoppedState extends JukeBoxState {
    play(music){
        console.log(`now playing ${music}`);
        this.jukebox.setState("playing");
    }
}

class PlayingState extends JukeBoxState {
    pause(music){
        console.log(`now pausing ${music}`);
        this.jukebox.setState("paused");
    }

    stop(music){
        console.log(`now stoping ${music}`);
        this.jukebox.setState("stopped");
    }
}

class PausedState extends JukeBoxState {
    play(music){
        console.log(`now playing ${music}`);
        this.jukebox.setState("playing");
    }

    stop(music){
        console.log(`now stoping ${music}`);
        this.jukebox.setState("stopped");
    }
}

//------------------------- client -----------------------

const jukebox = new JukeBox("Waka Waka");

jukebox.stop();
jukebox.play();
jukebox.pause();
jukebox.stop();
jukebox.pause();
jukebox.play();
jukebox.pause();
jukebox.pause();
jukebox.play();
jukebox.stop();