import ParkingLot from "./ParkingLot.js";
import Level from "./Level.js";
import Spot from "./Spot.js";
import Vehicle from "./Vehicle.js";
import VehicleType from "./VehicleType.js";
import EntryGate from "./EntryGate.js";
import ExitGate from "./ExitGate.js";

let parking_lot = ParkingLot.get_instance();


let level_1 = new Level();
level_1.add_spot(new Spot(VehicleType.CAR));
level_1.add_spot(new Spot(VehicleType.CAR));
level_1.add_spot(new Spot(VehicleType.MOTORBIKE));
level_1.add_spot(new Spot(VehicleType.TRUCK));
parking_lot.add_level(level_1);

let level_2 = new Level();
level_2.add_spot(new Spot(VehicleType.MOTORBIKE));
level_2.add_spot(new Spot(VehicleType.MOTORBIKE));
level_2.add_spot(new Spot(VehicleType.CAR));
level_2.add_spot(new Spot(VehicleType.TRUCK));
parking_lot.add_level(level_2);

let entry_gate_1 = new EntryGate(parking_lot);
let exit_gate_1 = new ExitGate(parking_lot);
console.log(`now free spots : ${Object.entries(parking_lot.get_free_spots())}`);
let parking_session_1 = entry_gate_1.enter(new Vehicle(VehicleType.CAR,"CAR_1"));
let parking_session_2 = entry_gate_1.enter(new Vehicle(VehicleType.CAR,"CAR_2"));
let parking_session_3 = entry_gate_1.enter(new Vehicle(VehicleType.CAR,"CAR_3"));
console.log(`now free spots : ${Object.entries(parking_lot.get_free_spots())}`);
exit_gate_1.exit(parking_session_1);
let parking_session_4 = entry_gate_1.enter(new Vehicle(VehicleType.CAR,"CAR_4"));
console.log(`now free spots : ${Object.entries(parking_lot.get_free_spots())}`);
let parking_session_5 = entry_gate_1.enter(new Vehicle(VehicleType.CAR,"CAR_5"));
console.log(`now free spots : ${Object.entries(parking_lot.get_free_spots())}`);
exit_gate_1.exit(parking_session_2);
exit_gate_1.exit(parking_session_3);
exit_gate_1.exit(parking_session_4);
console.log(`now free spots : ${Object.entries(parking_lot.get_free_spots())}`);
