/*
    Exercise: Facade — Home Theater

    The canonical Facade example. Turning on a movie requires orchestrating several subsystems in order.

    Subsystems (each does one job, knows nothing of the others):
    - Projector → on(), off(), setInput(source)
    - SoundSystem → on(), off(), setVolume(level)
    - StreamingPlayer → on(), off(), play(title), stop()
    - Lights → dim(percent), on()

    Facade — HomeTheaterFacade:
    - Holds instances of all four subsystems (composition).
    - watchMovie(title) orchestrates, in order: lights dim to 10% → projector on + input set to "streaming" → sound on + volume set → player on + play(title). Log a friendly "🎬 get ready..." line.
    - endMovie() reverses it: player stop + off → sound off → projector off → lights back on.

    Client (from the start):
    - const theater = new HomeTheaterFacade(); theater.watchMovie("Inception"); ... theater.endMovie();
    - One line each — proving the caller doesn't touch any subsystem directly.

    Grading focus:
    - Facade is thin — it only sequences subsystem calls. No business logic of its own (no volume-calculation algorithms, no DRM checks — just orchestration).
    - Subsystems are independent — none references the facade or each other.
    - watchMovie and endMovie each collapse a multi-step dance into one call.
    - Client never calls a subsystem method directly.
*/

class Projector {
    #input = null
    on(){
        console.log('projector on');
        console.log('set input of your choice');
    }
    off(){
        this.setInput(null);
        console.log('projector off input removed');
    }
    setInput(source){
        this.#input = source
        console.log(`projector input set to ${source}`);
    }
}
class SoundSystem {
    #volume = 0
    on(){
        console.log('speaker on');
        console.log('set volume of your choice');
    }
    off(){
        this.setvolume(0);
        console.log('speaker off');
    }
    setvolume(vol){
        this.#volume = vol;
        console.log(`speaker volume set to ${vol}`);
    }
}
class StreamingPlayer {
    #movie = null;
    on(){
        console.log('player on');
    }
    off(){
        this.stop();
        console.log('player off');
    } 
    play(title){
        this.#movie = title;
        console.log(`player playing ${title}`);
    } 
    stop(){
        this.#movie = null;
    }
}
class Lights {
    dim(percent){
        console.log(`light dimmed to ${percent} percent of total`);
    } 
    brighten(){
        console.log('lights on full capacity');
    }
    on(){
        console.log('lights on');
        this.brighten();
    }
}

class HomeTheaterFacade {

    #projector = null;
    #sound_system = null;
    #streaming_player = null;
    #lights = null;

    constructor(){
        this.#projector = new Projector();
        this.#sound_system = new SoundSystem();
        this.#streaming_player = new StreamingPlayer();
        this.#lights = new Lights();
    }

    watchMovie(title){
        console.log(`starting to play ${title}`);
        this.#projector.on();
        this.#projector.setInput("CD");
        this.#sound_system.on();
        this.#sound_system.setvolume(10);
        this.#streaming_player.on();
        this.#lights.dim(10);
        this.#streaming_player.play(title);
    }
    endMovie(){
        this.#lights.on();
        this.#sound_system.off();
        this.#streaming_player.off();
        this.#projector.off();
    }
}


//-----------------client------------
const theater = new HomeTheaterFacade();
theater.watchMovie("Inception");  
theater.endMovie();