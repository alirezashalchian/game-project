import { Client, getStateCallbacks } from 'colyseus.js';
 
async function connect() {
    const client = new Client('http://localhost:2567');
    const room = await client.joinOrCreate('game_room', {
        /* custom join options */
    });
    const $ = getStateCallbacks(room);
 
    // Listen to 'player' instance additions
    $(room.state).players.onAdd((player, sessionId) => {
        console.log('Player joined:', player, sessionId);
    });
 
    // Listen to 'player' instance removals
    $(room.state).players.onRemove((player, sessionId) => {
        console.log('Player left:', player, sessionId);
    });
 
    return room;
}
 
connect();