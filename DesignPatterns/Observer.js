/*

1. Subject: a Channel with a name. Holds a set of subscribers. Has subscribe(observer), unsubscribe(observer), and uploadVideo(title) which stores the video and notifies all subscribers.
2. Observer contract: update(channel, videoTitle) (base class throws if not overridden — or just document it).
3. Concrete observers:
  - EmailSubscriber(email) → logs an email notification
  - PushSubscriber(deviceId) → logs a push notification
4. Client: create a channel, subscribe 2–3 observers, upload a video (all react), then unsubscribe one and upload again (only the rest react) — proving runtime subscribe/unsubscribe.

- Channel depends only on the observer contract — it never checks if (observer instanceof EmailSubscriber).
- The unsubscribe actually works (use a Set, and remember the same object reference).
- Write the client from the start this time. 

*/


class Channel {
    #subscribers = null;
    #name = null;
    #uploaded_videos = null;

    constructor(name) {
        this.#subscribers =  new Set();
        this.#uploaded_videos = [];
        this.#name = name;
    }

    subscribe(subscriber){
        this.#subscribers.add(subscriber);
    }

    unsubscribe(subscriber){
        this.#subscribers.delete(subscriber);
    }

    upload(video){
        this.#uploaded_videos.push(video);
        this.#notify(video);
    }

    #notify(video){
        for(const subscriber of this.#subscribers ){
            subscriber.update(this.#name,video)
        }
    }
}

class Subscriber {
    id = null;
    constructor(id){
        this.id = id;
    }

    update(channel,video){
        throw Error("abstract method not implemeted");
    }
}

class EmailSubscriber extends Subscriber {
    update(channel,video){
        console.log(`email notifiation sent about ${video} uploaded by ${channel} on email id ${this.id}`);
    }
}

class PushSubscriber extends Subscriber {
    update(channel,video){
        console.log(`notifiation sent about ${video} uploaded by ${channel} on device id ${this.id}`);
    }
}

//-----------------------client---------------------------------

const dariyan_yt = new Channel("dariyan");

const Samarth = new EmailSubscriber("dariyasamarth@gmail.com");
const Saksham = new PushSubscriber("motoX3");

dariyan_yt.subscribe(Samarth);
dariyan_yt.subscribe(Saksham);

dariyan_yt.upload("LLD tutorial");

dariyan_yt.unsubscribe(Saksham);

dariyan_yt.upload("Observer tutorial");