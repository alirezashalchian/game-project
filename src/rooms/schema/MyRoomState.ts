import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") sessionId: string;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;

  // Quaternion rotation
  @type("number") qx: number = 0;
  @type("number") qy: number = 0;
  @type("number") qz: number = 0;
  @type("number") qw: number = 1;

  // Current gravity direction
  @type("number") gravityX: number = 0;
  @type("number") gravityY: number = -9.8;
  @type("number") gravityZ: number = 0;

  // Current floor surface
  @type("string") floorSurface: string = "bottom";

  // Animation state
  @type("string") currentAnimation: string = "Idle";

  // Room coordinates for dynamic room system
  @type("number") roomX: number = 4;
  @type("number") roomY: number = 4;
  @type("number") roomZ: number = 4;

  // Optional: Player name for multiplayer identification
  @type("string") playerName: string = "";
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();

  // Add room identification to the state
  @type("string") physicalRoomId: string = "";

  // Optional: Room-specific data
  @type("number") roomX: number = 4;
  @type("number") roomY: number = 4;
  @type("number") roomZ: number = 4;

  // Optional: Room state/events
  @type("string") roomEvent: string = "";
}