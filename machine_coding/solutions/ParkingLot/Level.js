class Level {
    spots = null;
    free_spots = null;

    constructor(){
        this.spots = {};
        this.free_spots = {};
    }

    get_free_spots(){
        return this.free_spots;
    }

    add_spot(spot){
        if(!(spot.type in this.spots)){
            this.spots[spot.type] = [];
        }
        this.spots[spot.type].push(spot);
        if(!(spot.type in this.free_spots)){
            this.free_spots[spot.type] = 0;
        }
        this.free_spots[spot.type]++;
        console.log(`spot for ${spot.type} added`);
    }

    has_free_spot(type){
        return (type in this.free_spots) && this.free_spots[type]>0;
    }

    assign_spot(type){
        for(const spot of this.spots[type]){
            if(spot.is_free()){
                // will revisit this
                spot.occupy();
                this.free_spots[spot.type]--;
                return spot;
            }
        }
        return null;
    }

    free_spot(spot){
        spot.leave();
        this.free_spots[spot.type]++;
    }
}

export default Level;