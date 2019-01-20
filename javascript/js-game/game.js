'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);   
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    const notInstanceOf = [].some.call(arguments, argument => {
        return !(argument instanceof Vector) && argument !== undefined;
      });

    if (notInstanceOf) {
      throw new Error('Аргументом может быть только вектор типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;    
  }

  act() {}

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y + this.size.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Аргументом может быть только вектор типа Vector');
    }
    return actor !== this &&
      this.top > actor.bottom &&
      this.bottom < actor.top &&
      this.right > actor.left &&
      this.left < actor.right;   
  }
}

class Level {
  constructor(grid, actors = []) {
    this.grid = grid;

    if (grid) {
      this.height = grid.length;
      this.width = Math.max.apply(null, grid.map(line => line.length));
    } else {
      this.height = 0;
      this.width = 0;
    }

    this.actors = actors;
    this.player = actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Аргументом может быть только вектор типа Vector');
    }
    
    if (this.actors) {
      return this.actors
        .find(other => actor.isIntersect(other)); 
    }    
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector && size instanceof Vector)) {
      throw new Error('Аргументом может быть только вектор типа Vector'); 
    } 

    const xStart = Math.floor(pos.x);
    const xEnd = Math.ceil(pos.x + size.x);
    const yStart = Math.floor(pos.y);
    const yEnd = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0) {
      return "wall";
    }

    if (yEnd > this.height) {
      return "lava";
    }

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        const fieldType = this.grid[y][x];
        if (fieldType) {
            return fieldType;
        }
      }
    }
  } 

  removeActor(actor) {
    this.actors = this.actors.filter(other => other !== actor);
  }

  noMoreActors(type) {
    return this.actors.some(actor => actor.type === type)
  }

  playerTouched(type, actor) {
    if (type === "lava" || type === 'fireball' &&
      this.status == null) {
      this.status = "lost";
    } else if (type === "coin" && actor instanceof Coin) {
      this.removeActor(actor);
      if (!this.noMoreActors('coin')) {
        this.status = "won";
      }
    }
  }
}

class LevelParser {
  constructor(actorsDict) {
    this.actorsDict = actorsDict;
  }

  actorFromSymbol(symbol) {
    const symbolKey = Object.keys(this.actorsDict)
      .find(key => key === symbol);

    return this.actorsDict[symbolKey];
  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    }
    if (symbol === '!') {
      return 'lava';
    }
  }

  createGrid(plan) {
    return plan.map(line => {
      let splitLine = line.split('');
      return splitLine
        .map(symbol => this.obstacleFromSymbol(symbol))
    })
  }

  createActors(plan) {
    let actors = [];
    plan.map((line, i) => {
      let splitLine = line.split('');
      splitLine.map((actor, j) => {
        const Actor = this.actorFromSymbol(actor);
        if (Actor) {
          actors.push(new Actor(new Vector(j, i)));
        }
      })
    });
    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super();
    this.pos = pos;
    this.speed = speed;
    this.size = new Vector(1, 1);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    let nextXPosition = this.pos.x + this.speed.x * time;
    let nextYPosition = this.pos.y + this.speed.y * time;
    return new Vector(nextXPosition, nextYPosition);
  }

  handleObstacle() {
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }

  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle()
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super();
    this.startPos = pos;
    this.pos = this.startPos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super();
    this.startPos = new Vector(pos.x + 0.2, pos.y + 0.1);
    this.pos = this.startPos;
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return new Vector(this.startPos.x,
      this.startPos.y + this.getSpringVector().y)
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector()) {
    super();
    this.pos = new Vector(pos.x, pos.y - 0.5);
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector();
  }

  get type() {
    return 'player';
  }
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
};

const schemas = [
  [
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ],
  [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));

/*const parser = new LevelParser(actorDict);

loadLevels().then(level => {
    runGame(JSON.parse(level), parser, DOMDisplay)
        .then(() => alert('Вы выиграли приз!'));
});*/