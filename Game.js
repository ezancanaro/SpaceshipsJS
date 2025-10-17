//Control
const CANVAS_ID = 'space_wars_canvas';
const CANVAS_BUFFER_ID = 'space_wars_canvas_bf';
const SHIP_RADIUS = 10;
const ROTATION_SPEED = 0.03;
const KEYS_PRESSED = {};
const STAR_POSITION = { x: 150, y: 150 }
const STAR_RADIUS = 30;
const STAR_COLOR = '#F5A927';
const TOP_SPEED = 10;
const MAX_ACCELERATION = 2;
const ACCELERATION_DELTA = 0.02;

let game_ended = false;

let renderer;
let buffer = document.createElement('canvas');
let renderCtx;
let bufferCtx;
let needle_audit = { x: 0, y: 0, a: 0 };
let wedge_audit = { x: 0, y: 0, a: 0 };

//ships
let needle = {
    position: { x: 20, y: 20 },
    torpedoes: 10,
    rotation: 0,
    rotation_dir: 0,
    acceleration: 0,
    exploded: false,
    lives: 5,
    color: '#E427F5'
};
let wedge = {
    position: { x: 100, y: 100 },
    torpedoes: 10,
    rotation: Math.PI,
    rotation_dir: 0,
    acceleration: 0,
    exploded: false,
    lives: 5,
    color: '#2798F5'
};

const INITIAL_STATE = { needle_start: needle, wedge_start: wedge };

function init_ships() {

}

function init_audit() {
    needle_audit.x = document.getElementById('needle_x');
    needle_audit.y = document.getElementById('needle_y');
    needle_audit.a = document.getElementById('needle_a');
    wedge_audit.x = document.getElementById('wedge_x');
    wedge_audit.y = document.getElementById('wedge_y');
    wedge_audit.a = document.getElementById('wedge_a');
}

function init_canvas() {
    renderer = document.getElementById(CANVAS_ID);
    buffer.width = renderer.width;
    buffer.height = renderer.height;
    bufferCtx = buffer.getContext("2d");
    renderCtx = renderer.getContext("2d");
    window.requestAnimationFrame(game_loop);
}

function init() {
    init_canvas();
    init_ships();
    init_audit();
}

function draw_star() {
    bufferCtx.save();
    bufferCtx.fillStyle = STAR_COLOR;
    bufferCtx.beginPath();
    bufferCtx.arc(STAR_POSITION.x, STAR_POSITION.y, STAR_RADIUS, 0, Math.PI * 2);
    bufferCtx.fill();
    bufferCtx.restore();
}

function draw_explosion() {

}

function draw_ship(ship) {
    bufferCtx.save();
    bufferCtx.fillStyle = ship.color;
    bufferCtx.translate(ship.position.x, ship.position.y);
    bufferCtx.rotate(ship.rotation);

    if (ship.exploded) {
        draw_explosion();
    } else {
        let vertices = get_ship_vertices({ x: 0, y: 0 });
        bufferCtx.beginPath();
        bufferCtx.moveTo(vertices[0].x, 0);
        // bufferCtx.lineTo(-SHIP_RADIUS, 0);
        bufferCtx.lineTo(vertices[1].x, vertices[1].y);
        bufferCtx.fill();
        bufferCtx.lineTo(vertices[2].x, vertices[2].y);
        bufferCtx.fill();
    }

    bufferCtx.restore();
}

function check_ship_boundary_collision(ship) {
    let v = get_ship_vertices(ship.position);
    let boundary_lines = [
        { point1: { x: 0, y: 0 }, point2: { x: 0, y: renderer.height } },
        { point1: { x: 0, y: 0 }, point2: { x: renderer.width, y: 0 } },
        { point1: { x: renderer.width, y: 0 }, point2: { x: renderer.width, y: renderer.height } },
        { point1: { x: 0, y: renderer.height }, point2: { x: renderer.width, y: renderer.height } },
    ]
    let ship_lines = [
        { point1: { x: v[0].x, y: v[0].y }, point2: { x: v[1].x, y: v[1].y } },
        { point1: { x: v[0].x, y: v[0].y }, point2: { x: v[2].x, y: v[2].y } },
        { point1: { x: v[1].x, y: v[1].y }, point2: { x: v[2].x, y: v[2].y } },
    ]
    for (let line of ship_lines) {
        for (let bound of boundary_lines) {
            if (check_lines_collision(line.point1, line.point2, bound.point1, bound.point2)) {
                return true;
            }
        }
    }
    return false;
}


/**
 * Checks collision between 2 lines.
 * Line 1 is from point1 to point2.
 * Line 2 is from point3 to point4.
 */
function check_lines_collision(point1, point2, point3, point4) {

    let divisor =
        ((point4.y - point3.y) * (point2.x - point1.x)
            - (point4.x - point3.x) * (point2.y - point1.y))
    let cpA =
        ((point4.x - point3.x) * (point1.y - point3.y)
            - (point4.y - point3.y) * (point1.x - point3.x))
        / divisor;
    let cpB =
        ((point1.x - point1.x) * (point1.y - point3.y)
            - (point2.y - point1.y) * (point1.x - point3.x))
        / divisor;

    return cpA >= 0 && cpA <= 1 && cpB >= 0 && cpB <= 1;
}

function get_ship_vertices(base_position) {
    return [
        { x: base_position.x + SHIP_RADIUS, y: base_position.y },
        { x: base_position.x - SHIP_RADIUS, y: base_position.y + SHIP_RADIUS },
        { x: base_position.x - SHIP_RADIUS, y: base_position.y - SHIP_RADIUS },
    ]
}

function rotate_ship(ship) {
    if (ship.rotation_dir != 0) {
        ship.rotation += ship.rotation_dir * ROTATION_SPEED;
    }
}

function move_ship(ship) {
    //STAR_GRAVITY_PULL
    //SHIP_THRUSTERS
    let direction_vec = { x: Math.cos(ship.rotation), y: Math.sin(ship.rotation) };
    ship.position.x += direction_vec.x * ship.acceleration;
    ship.position.y += direction_vec.y * ship.acceleration;
}

function update_ship_position(ship) {
    rotate_ship(ship);
    move_ship(ship);
}

function render_ships() {
    update_ship_position(needle);
    update_ship_position(wedge);
    draw_ship(needle);
    draw_ship(wedge);
}


function rotate(modifier) {
    needle.rotation += modifier * ROTATION_SPEED;
    wedge.rotation += modifier * ROTATION_SPEED;
}


/**
 * Handles collisions between game objects.
 * 1. Check for ships colliding with the boundary;
 * 2. Check for ships colliding with the star;
 */
function handle_object_collisions(ship) {
    if (check_ship_boundary_collision(ship)) {
        console.log("SHIP IS TOUCHING BOUNDS!");
        return true;
    }
    //TO-DO: Check for collision between Ship and Star
}

/**
 * Check if ships collide with each other
 */
function handle_ships_collision() {

}


/**
 * Sets the ship acceleration with given magnitude.
 * Acceleration starts slow and increases faster the longer the key is pressed
 * Should go from 0 up to MAX_ACCELERATION. 
**/
function set_acceleration(ship, magnitude) {
    ship.acceleration += magnitude * ACCELERATION_DELTA;
    if (ship.acceleration > MAX_ACCELERATION) {
        ship.acceleration = MAX_ACCELERATION;
    } else if (ship.acceleration < 0) {
        ship.acceleration = 0;
    }
}


function set_rotation(ship, direction) {
    if (ship.rotation_dir == direction) {
        return;
    }
    if (ship.rotation_dir == -direction) {
        ship.rotation_dir = 0;
    } else {
        ship.rotation_dir = direction;
    }
}

function unset_rotation(ship, direction) {
    if (ship.rotation_dir == direction) {
        ship.rotation_dir = 0;
    } else if (ship.rotation_dir == -direction) {
        return;
    }
}

function set_audit() {
    needle_audit.x.innerHTML = needle.position.x;
    wedge_audit.x.innerHTML = wedge.position.x;
    needle_audit.y.innerHTML = needle.position.y;
    wedge_audit.y.innerHTML = wedge.position.y;
    needle_audit.a.innerHTML = needle.acceleration;
    wedge_audit.a.innerHTML = wedge.acceleration;
}

function handle_pressed_keys() {
    Object.keys(KEYS_PRESSED).forEach(key => {
        console.log(key);
        switch (key) {
            case 'a': set_rotation(needle, -1); break;
            case 'd': set_rotation(needle, 1); break;
            case 'w': set_acceleration(needle, 1); break;
            case 'j': set_rotation(wedge, -1); break;
            case 'l': set_rotation(wedge, 1); break;
            case 'i': set_acceleration(wedge, 1); break;
        }
    });
}

function key_pressed(event) {
    KEYS_PRESSED[event.key] = true;
}

function key_released(event) {
    delete KEYS_PRESSED[event.key];
    switch (event.key) {
        case 'a': unset_rotation(needle, -1); break;
        case 'd': unset_rotation(needle, 1); break;
        case 'w': set_acceleration(needle, 0); break;
        case 'j': unset_rotation(wedge, -1); break;
        case 'l': unset_rotation(wedge, 1); break;
        case 'i': set_acceleration(wedge, 0); break;
    }
}

/**
 * Resets the game to INITIAL_STATE
 */
function game_reset() {

}

function render_game() {
    bufferCtx.fillStyle = "rgb(255 255 255 / 30%)";
    bufferCtx.fillRect(0, 0, buffer.width, buffer.height);
    //bufferCtx.clearRect(0, 0, 300, 300);
    handle_pressed_keys();
    draw_star();
    render_ships();
    if (handle_object_collisions(needle)) {
        game_ended = true;
    };
    handle_object_collisions(wedge);

    /**
     * To-DO: Add code for respawning ship after explosion
     * Should only happen after X frames of exploding.
     * Add grace period to avoid spawn camping?
    **/

    renderCtx.drawImage(buffer, 0, 0);
    set_audit();
}

function game_loop() {
    if (!game_ended) {
        render_game();
        window.requestAnimationFrame(game_loop);
    } else {
        bufferCtx.fillStyle = "rgb(255 255 255 / 30%)";
        bufferCtx.fillRect(0, 0, buffer.width, buffer.height);
        bufferCtx.fillStyle = "red";
        bufferCtx.font = "64px serif";
        bufferCtx.fillText("Game Ended!", renderer.width / 2, renderer.height / 2);
        renderCtx.drawImage(buffer, 0, 0);
    }
}